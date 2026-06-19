import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectionsApi, templatesApi } from '../api.js';
import type { Inspection, Template } from '../types.js';

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

  return (
    <div className="page">
      <div className="page__bar">
        <h2>점검 결과</h2>
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
