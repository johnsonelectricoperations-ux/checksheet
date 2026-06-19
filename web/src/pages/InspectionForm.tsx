import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templatesApi } from '../api.js';
import MediaCapture, { type LocalMedia } from '../components/MediaCapture.js';
import OptionalAttachments from '../components/OptionalAttachments.js';
import GuideView from '../components/GuideView.js';
import { cacheTemplate, getCachedTemplate } from '../offline/store.js';
import { enqueueInspection } from '../offline/store.js';
import { refreshPendingCount, syncPending } from '../offline/sync.js';
import type { Field, Template } from '../types.js';

export default function InspectionForm({ inspectorName = '' }: { inspectorName?: string }) {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [inspector, setInspector] = useState(inspectorName);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [mediaByField, setMediaByField] = useState<Record<string, LocalMedia[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    templatesApi
      .get(templateId!)
      .then((t) => {
        setTemplate(t);
        void cacheTemplate(t); // 오프라인 재사용 대비
      })
      .catch(async () => {
        // 오프라인: 캐시된 템플릿으로 점검 진행
        const cached = await getCachedTemplate(templateId!);
        if (cached) setTemplate(cached);
        else setError('템플릿을 불러올 수 없습니다 (오프라인이며 캐시 없음).');
      })
      .finally(() => setLoading(false));
  }, [templateId]);

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers((a) => ({ ...a, [fieldId]: value }));
  }

  // 제출 전 검증: 필수 항목, 숫자 합격기준, 미디어 최소 개수
  function validate(t: Template): string | null {
    for (const f of t.fields) {
      const v = answers[f.id];
      const media = mediaByField[f.id] ?? [];
      if (f.type === 'photo' || f.type === 'video') {
        const min = f.media?.minCount ?? (f.required ? 1 : 0);
        if (media.length < min) return `"${f.label}" 항목은 최소 ${min}개의 미디어가 필요합니다.`;
        continue;
      }
      if (f.required && (v === undefined || v === '' || v === null)) {
        return `"${f.label}" 항목은 필수입니다.`;
      }
      if (f.type === 'number' && v !== undefined && v !== '') {
        const n = Number(v);
        if (f.criteria?.min != null && n < f.criteria.min)
          return `"${f.label}" 값이 최소(${f.criteria.min}) 미만입니다.`;
        if (f.criteria?.max != null && n > f.criteria.max)
          return `"${f.label}" 값이 최대(${f.criteria.max}) 초과입니다.`;
      }
    }
    return null;
  }

  async function submit() {
    if (!template) return;
    const err = validate(template);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const inspectionId = crypto.randomUUID();
      // 오프라인 우선: 먼저 로컬(IndexedDB) 대기열에 저장 → WiFi 불안정해도 안전
      const media = Object.entries(mediaByField).flatMap(([fieldId, items]) =>
        items.map((m) => ({
          id: m.id,
          fieldId,
          type: m.type,
          blob: m.file,
          filename: m.file.name || `${m.type}-${m.id}`,
          uploaded: false,
        })),
      );
      await enqueueInspection({
        id: inspectionId,
        payload: {
          id: inspectionId,
          templateId: template.id,
          templateVersion: template.version,
          inspector,
          answers,
          // 점검 시점의 항목 정의를 함께 저장 → 이후 템플릿 수정과 무관하게 결과 정확
          templateSnapshot: {
            title: template.title,
            version: template.version,
            fields: template.fields,
          },
          createdAt: new Date().toISOString(),
        },
        media,
        status: 'pending',
        savedAt: new Date().toISOString(),
        inspectionSaved: false,
      });
      await refreshPendingCount();
      void syncPending(); // 온라인이면 즉시 전송 시도, 아니면 대기

      alert(
        navigator.onLine
          ? '점검 결과가 저장되었습니다. 서버로 전송 중입니다.'
          : '오프라인 상태입니다. 점검 결과는 기기에 저장되었고, 연결되면 자동 전송됩니다.',
      );
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page">불러오는 중…</div>;
  if (!template) return <div className="page error">{error || '템플릿을 찾을 수 없습니다.'}</div>;

  return (
    <div className="page">
      <div className="page__bar">
        <h2>{template.title}</h2>
        <button className="btn" onClick={() => navigate('/')}>
          취소
        </button>
      </div>
      {template.description && <p className="placeholder">{template.description}</p>}
      {error && <p className="error">{error}</p>}

      <label className="field">
        <span>점검자</span>
        <input value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder="이름" />
      </label>

      {template.fields.map((f) => (
        <div key={f.id} className="inspect-field">
          <div className="inspect-field__label">
            {f.label}
            {f.required && <span className="req"> *</span>}
          </div>
          <GuideView field={f} />
          {renderInput(f, answers[f.id], (v) => setAnswer(f.id, v), mediaByField[f.id] ?? [], (items) =>
            setMediaByField((m) => ({ ...m, [f.id]: items })),
          )}
          {/* 사진/동영상 항목이 아닌 경우, 필요할 때만 선택적으로 첨부 */}
          {f.type !== 'photo' && f.type !== 'video' && (
            <OptionalAttachments
              items={mediaByField[f.id] ?? []}
              onChange={(items) => setMediaByField((m) => ({ ...m, [f.id]: items }))}
            />
          )}
        </div>
      ))}

      <button className="btn btn--primary btn--block" onClick={submit} disabled={submitting}>
        {submitting ? '저장 중…' : '점검 완료 / 저장'}
      </button>
    </div>
  );
}

function renderInput(
  f: Field,
  value: unknown,
  onChange: (v: unknown) => void,
  media: LocalMedia[],
  onMediaChange: (items: LocalMedia[]) => void,
) {
  switch (f.type) {
    case 'check':
      return (
        <div className="check-group">
          {['OK', 'NG'].map((opt) => (
            <button
              key={opt}
              type="button"
              className={`check-btn ${value === opt ? `check-btn--${opt.toLowerCase()}` : ''}`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    case 'number':
      return (
        <div className="num-input">
          <input
            type="number"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {(f.criteria?.min != null || f.criteria?.max != null || f.criteria?.unit) && (
            <span className="hint">
              기준: {f.criteria?.min ?? '-'} ~ {f.criteria?.max ?? '-'} {f.criteria?.unit ?? ''}
            </span>
          )}
        </div>
      );
    case 'text':
      return (
        <textarea
          rows={2}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'date':
      return (
        <input type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
      );
    case 'select':
      return (
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">선택…</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'photo':
    case 'video':
      return <MediaCapture field={f} items={media} onChange={onMediaChange} />;
    default:
      return null;
  }
}
