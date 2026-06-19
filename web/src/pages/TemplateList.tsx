import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { templatesApi } from '../api.js';
import type { Template } from '../types.js';

export default function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTemplates(await templatesApi.list(includeInactive));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  async function onDuplicate(id: string) {
    await templatesApi.duplicate(id);
    load();
  }

  async function onToggleActive(t: Template) {
    await templatesApi.setActive(t.id, !t.active);
    load();
  }

  return (
    <div className="page">
      <div className="page__bar">
        <h2>점검시트 목록</h2>
        <button className="btn btn--primary" onClick={() => navigate('/templates/new')}>
          + 신규 생성
        </button>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
        />
        비활성 포함
      </label>

      {loading && <p>불러오는 중…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && templates.length === 0 && (
        <p className="placeholder">아직 만든 점검시트가 없습니다. 신규로 생성해 보세요.</p>
      )}

      <ul className="card-list">
        {templates.map((t) => (
          <li key={t.id} className={`card ${t.active ? '' : 'card--inactive'}`}>
            <div className="card__main">
              <Link to={`/templates/${t.id}`} className="card__title">
                {t.title}
              </Link>
              <div className="card__meta">
                항목 {t.fields.length}개 · v{t.version}
                {!t.active && ' · 비활성'}
              </div>
              {t.description && <div className="card__desc">{t.description}</div>}
            </div>
            <div className="card__actions">
              <button className="btn" onClick={() => onDuplicate(t.id)}>
                복제
              </button>
              <button className="btn" onClick={() => onToggleActive(t)}>
                {t.active ? '비활성화' : '활성화'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
