import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inspectionsApi, templatesApi } from '../api.js';
import MediaCapture, { type LocalMedia } from '../components/MediaCapture.js';
import type { Field, Template } from '../types.js';

export default function InspectionForm() {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [inspector, setInspector] = useState('');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [mediaByField, setMediaByField] = useState<Record<string, LocalMedia[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    templatesApi
      .get(templateId!)
      .then(setTemplate)
      .catch((e) => setError((e as Error).message))
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
      await inspectionsApi.save({
        id: inspectionId,
        templateId: template.id,
        templateVersion: template.version,
        inspector,
        answers,
        createdAt: new Date().toISOString(),
      });
      // 미디어는 텍스트 결과 저장 후 별도 업로드
      for (const [fieldId, items] of Object.entries(mediaByField)) {
        for (const m of items) {
          await inspectionsApi.uploadMedia(inspectionId, {
            mediaId: m.id,
            fieldId,
            type: m.type,
            file: m.file,
          });
        }
      }
      alert('점검 결과가 저장되었습니다.');
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
          {renderInput(f, answers[f.id], (v) => setAnswer(f.id, v), mediaByField[f.id] ?? [], (items) =>
            setMediaByField((m) => ({ ...m, [f.id]: items })),
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
