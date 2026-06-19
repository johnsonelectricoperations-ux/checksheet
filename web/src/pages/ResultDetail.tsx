import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inspectionsApi, mediaUrl, templatesApi } from '../api.js';
import type { Field, Inspection, Template } from '../types.js';

export default function ResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inspectionsApi
      .get(id!)
      .then(async (ins) => {
        setInspection(ins);
        // 스냅샷이 있으면 템플릿 조회 불필요 (점검 시점 항목 정의 사용)
        if (!ins.templateSnapshot?.fields?.length) {
          try {
            setTemplate(await templatesApi.get(ins.templateId));
          } catch {
            /* 템플릿이 삭제됐을 수 있음 → 라벨 없이 표시 */
          }
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page">불러오는 중…</div>;
  if (!inspection) return <div className="page error">{error || '결과를 찾을 수 없습니다.'}</div>;

  // 점검 시점 스냅샷 우선 → 템플릿이 수정되어도 결과 라벨이 정확.
  const snapshot = inspection.templateSnapshot;
  const fields: Field[] = snapshot?.fields?.length ? snapshot.fields : (template?.fields ?? []);
  const title = snapshot?.title ?? template?.title ?? '점검 결과';
  const mediaByField = groupMedia(inspection);

  return (
    <div className="page">
      <div className="page__bar">
        <h2>{title}</h2>
        <div className="no-print">
          <button className="btn" onClick={() => window.print()}>
            인쇄/PDF
          </button>
          <button className="btn" onClick={() => navigate('/results')}>
            목록
          </button>
        </div>
      </div>

      <div className="result-meta">
        <div>점검자: {inspection.inspector || '-'}</div>
        <div>작성: {new Date(inspection.createdAt).toLocaleString('ko-KR')}</div>
        <div>서버 수신: {new Date(inspection.receivedAt).toLocaleString('ko-KR')}</div>
        <div>시트 버전: v{inspection.templateVersion}</div>
      </div>

      {fields.length === 0 && (
        <p className="placeholder">템플릿 정보가 없어 항목 라벨을 표시할 수 없습니다.</p>
      )}

      {fields.map((f) => {
        const media = mediaByField[f.id] ?? [];
        const value = inspection.answers[f.id];
        return (
          <div key={f.id} className="inspect-field">
            <div className="inspect-field__label">{f.label}</div>
            {f.type !== 'photo' && f.type !== 'video' && (
              <div className="result-value">{formatValue(value)}</div>
            )}
            {media.length > 0 && <MediaGrid media={media} />}
          </div>
        );
      })}
    </div>
  );
}

function MediaGrid({ media }: { media: { id: string; type: string }[] }) {
  return (
    <div className="media__previews">
      {media.map((m) => (
        <a key={m.id} href={mediaUrl(m.id)} target="_blank" rel="noreferrer" className="media__thumb">
          {m.type === 'photo' ? (
            <img src={mediaUrl(m.id)} alt="" />
          ) : (
            <video src={mediaUrl(m.id)} controls />
          )}
        </a>
      ))}
    </div>
  );
}

function groupMedia(ins: Inspection): Record<string, { id: string; type: string }[]> {
  const out: Record<string, { id: string; type: string }[]> = {};
  for (const m of ins.media ?? []) {
    (out[m.fieldId] ??= []).push({ id: m.id, type: m.type });
  }
  return out;
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null || v === '') return '-';
  return String(v);
}
