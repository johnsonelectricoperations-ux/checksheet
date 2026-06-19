import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import TemplateList from './pages/TemplateList.js';
import TemplateEditor from './pages/TemplateEditor.js';
import InspectionForm from './pages/InspectionForm.js';

export default function App() {
  const online = useOnlineStatus();

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app__header">
          <Link to="/" className="app__logo">
            현장 점검시트
          </Link>
          <span className={`status ${online ? 'status--online' : 'status--offline'}`}>
            {online ? '🟢 온라인' : '🔴 오프라인'}
          </span>
        </header>

        <main className="app__main">
          <Routes>
            <Route path="/" element={<TemplateList />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id" element={<TemplateEditor />} />
            <Route path="/inspect/:templateId" element={<InspectionForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
