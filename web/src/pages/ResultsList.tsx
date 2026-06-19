import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectionsApi, templatesApi } from '../api.js';
import { downloadCsv } from '../utils/csv.js';
import type { Field, Inspection, Template } from '../types.js';

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

  const filtered = useMemo(() => {
    return inspections.filter((ins) => {
      if (templateId && ins.templateId !== templateId) return false;
      if (query) {
        const q = query.toLowerCase();
        const title = (titleById[ins.templateId] ?? '').toLowerCase();
        if (!ins.inspector.toLowerCase().includes(q) && !title.includes(q)) return false;
      }
      return true;
    });
  }, [inspections, templateId, query, titleById]);

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
        <input
          placeholder="점검자/시트명 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

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
          </li>
        ))}
      </ul>
    </div>
  );
}
