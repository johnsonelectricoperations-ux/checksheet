import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectionsApi, templatesApi } from '../api.js';
import { downloadCsv } from '../utils/csv.js';
import { evaluateInspection, type InspectionStatus } from '../utils/evaluate.js';
import type { Field, Inspection, Template } from '../types.js';

function StatusBadge({ status }: { status: InspectionStatus }) {
  const cls =
    status === '합격' ? 'badge--pass' : status === '불합격' ? 'badge--fail' : 'badge--na';
  return <span className={`badge ${cls}`}>{status}</span>;
}

// 한 셀 값: 미디어 항목은 첨부 개수, 그 외는 입력값
function cellFor(ins: Inspection, f: Field): string {
  if (f.type === 'photo' || f.type === 'video') {
    const n = (ins.media ?? []).filter((m) => m.fieldId === f.id).length;
    return n > 0 ? `첨부 ${n}` : '';
  }
  const v = ins.answers[f.id];
  return v == null ? '' : String(v);
}

export default function ResultsList() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [status, setStatus] = useState<'' | InspectionStatus>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([inspectionsApi.list(), templatesApi.list(true)])
      .then(([ins, tpls]) => {
        setInspections(ins);
        setTemplates(tpls);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const titleById = useMemo(
    () => Object.fromEntries(templates.map((t) => [t.id, t.title])),
    [templates],
  );
  const fieldsById = useMemo(
    () => Object.fromEntries(templates.map((t) => [t.id, t.fields])),
    [templates],
  );

  // 점검 시점 스냅샷 우선, 없으면 현재 템플릿 항목으로 판정
  const statusOf = useMemo(() => {
    const cache = new Map<string, InspectionStatus>();
    return (ins: Inspection): InspectionStatus => {
      if (cache.has(ins.id)) return cache.get(ins.id)!;
      const fields: Field[] = ins.templateSnapshot?.fields?.length
        ? ins.templateSnapshot.fields
        : (fieldsById[ins.templateId] ?? []);
      const s = evaluateInspection(fields, ins.answers).status;
      cache.set(ins.id, s);
      return s;
    };
  }, [fieldsById]);

  const filtered = useMemo(() => {
    return inspections.filter((ins) => {
      if (templateId && ins.templateId !== templateId) return false;
      if (status && statusOf(ins) !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        const title = (titleById[ins.templateId] ?? '').toLowerCase();
        if (!ins.inspector.toLowerCase().includes(q) && !title.includes(q)) return false;
      }
      return true;
    });
  }, [inspections, templateId, status, query, titleById, statusOf]);

  const summary = useMemo(() => {
    const s = { 합격: 0, 불합격: 0, 판정없음: 0 } as Record<InspectionStatus, number>;
    for (const ins of filtered) s[statusOf(ins)]++;
    return s;
  }, [filtered, statusOf]);

  function exportCsv() {
    const selected = templates.find((t) => t.id === templateId);
    const rows: (string | number)[][] = [];
    if (selected) {
      // 특정 시트: 항목 라벨을 열로
      const fields = selected.fields;
      rows.push(['작성일시', '점검자', ...fields.map((f) => f.label)]);
      for (const ins of filtered) {
        rows.push([
          new Date(ins.createdAt).toLocaleString('ko-KR'),
          ins.inspector,
          ...fields.map((f) => cellFor(ins, f)),
        ]);
      }
    } else {
      // 전체: 기본 열
      rows.push(['점검시트', '작성일시', '점검자', '첨부수']);
      for (const ins of filtered) {
        rows.push([
          titleById[ins.templateId] ?? '(삭제됨)',
          new Date(ins.createdAt).toLocaleString('ko-KR'),
          ins.inspector,
          ins.media?.length ?? 0,
        ]);
      }
    }
    const name = `점검결과_${selected ? selected.title + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(name, rows);
  }

  return (
    <div className="page">
      <div className="page__bar">
        <h2>점검 결과</h2>
        <button className="btn" onClick={exportCsv} disabled={filtered.length === 0}>
          CSV 내보내기
        </button>
      </div>

      <div className="filters">
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">모든 점검시트</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as '' | InspectionStatus)}>
          <option value="">모든 판정</option>
          <option value="합격">합격</option>
          <option value="불합격">불합격</option>
          <option value="판정없음">판정없음</option>
        </select>
        <input
          placeholder="점검자/시트명 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!loading && filtered.length > 0 && (
        <div className="summary">
          <span>전체 {filtered.length}</span>
          <span className="summary__pass">합격 {summary.합격}</span>
          <span className="summary__fail">불합격 {summary.불합격}</span>
          {summary.판정없음 > 0 && <span>판정없음 {summary.판정없음}</span>}
        </div>
      )}

      {loading && <p>불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && filtered.length === 0 && <p className="placeholder">점검 결과가 없습니다.</p>}

      <ul className="card-list">
        {filtered.map((ins) => (
          <li key={ins.id} className="card">
            <div className="card__main">
              <Link to={`/results/${ins.id}`} className="card__title">
                {titleById[ins.templateId] ?? '(삭제된 시트)'}
              </Link>
              <div className="card__meta">
                {new Date(ins.createdAt).toLocaleString('ko-KR')}
                {ins.inspector && ` · ${ins.inspector}`}
                {ins.media && ins.media.length > 0 && ` · 📎 ${ins.media.length}`}
              </div>
            </div>
            <div className="card__actions">
              <StatusBadge status={statusOf(ins)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
