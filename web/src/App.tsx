import { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { useSync } from './hooks/useSync.js';
import { useAuth } from './hooks/useAuth.js';
import { authApi } from './api.js';
import { clearSession } from './auth/session.js';
import { startAutoSync } from './offline/sync.js';
import Login from './pages/Login.js';
import TemplateList from './pages/TemplateList.js';
import TemplateEditor from './pages/TemplateEditor.js';
import InspectionForm from './pages/InspectionForm.js';
import ResultsList from './pages/ResultsList.js';
import ResultDetail from './pages/ResultDetail.js';
import Users from './pages/Users.js';

export default function App() {
  const { online, pending, syncing, syncNow } = useSync();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    startAutoSync();
  }, []);

  if (!user) return <Login />;

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      /* 오프라인이어도 로컬 세션은 정리 */
    }
    clearSession();
  }

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
            {isAdmin && <Link to="/users">사용자</Link>}
          </nav>
          <div className="app__status" onClick={syncNow} title="지금 동기화">
            {pending > 0 && (
              <span className="status status--pending">
                {syncing ? '⏳ 동기화 중' : `⬆ 대기 ${pending}건`}
              </span>
            )}
            <span className={`status ${online ? 'status--online' : 'status--offline'}`}>
              {online ? '🟢' : '🔴'}
            </span>
          </div>
          <div className="app__user">
            <span className="app__username">
              {user.name || user.username}
              {isAdmin && ' (관리자)'}
            </span>
            <button className="btn btn--sm" onClick={logout}>
              로그아웃
            </button>
          </div>
        </header>

        <main className="app__main">
          <Routes>
            <Route path="/" element={<TemplateList isAdmin={isAdmin} />} />
            <Route
              path="/templates/new"
              element={isAdmin ? <TemplateEditor /> : <Navigate to="/" replace />}
            />
            <Route
              path="/templates/:id"
              element={isAdmin ? <TemplateEditor /> : <Navigate to="/" replace />}
            />
            <Route path="/inspect/:templateId" element={<InspectionForm inspectorName={user.name} />} />
            <Route path="/results" element={<ResultsList />} />
            <Route path="/results/:id" element={<ResultDetail />} />
            <Route
              path="/users"
              element={isAdmin ? <Users /> : <Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
