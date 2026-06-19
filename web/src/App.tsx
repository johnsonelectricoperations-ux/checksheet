import { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { useSync } from './hooks/useSync.js';
import { startAutoSync } from './offline/sync.js';
import TemplateList from './pages/TemplateList.js';
import TemplateEditor from './pages/TemplateEditor.js';
import InspectionForm from './pages/InspectionForm.js';
import ResultsList from './pages/ResultsList.js';
import ResultDetail from './pages/ResultDetail.js';

export default function App() {
  const { online, pending, syncing, syncNow } = useSync();

  // 앱 시작 시 자동 동기화 시작 (온라인 복귀 + 주기 폴링)
  useEffect(() => {
    startAutoSync();
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app__header">
          <Link to="/" className="app__logo">
            현장 점검시트
          </Link>
          <nav className="app__nav">
            <Link to="/">점검시트</Link>
            <Link to="/results">결과</Link>
          </nav>
          <div className="app__status" onClick={syncNow} title="지금 동기화">
            {pending > 0 && (
              <span className="status status--pending">
                {syncing ? '⏳ 동기화 중' : `⬆ 대기 ${pending}건`}
              </span>
            )}
            <span className={`status ${online ? 'status--online' : 'status--offline'}`}>
              {online ? '🟢 온라인' : '🔴 오프라인'}
            </span>
          </div>
        </header>

        <main className="app__main">
          <Routes>
            <Route path="/" element={<TemplateList />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id" element={<TemplateEditor />} />
            <Route path="/inspect/:templateId" element={<InspectionForm />} />
            <Route path="/results" element={<ResultsList />} />
            <Route path="/results/:id" element={<ResultDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
