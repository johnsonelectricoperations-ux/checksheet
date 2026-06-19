import { useOnlineStatus } from './hooks/useOnlineStatus.js';

export default function App() {
  const online = useOnlineStatus();

  return (
    <div className="app">
      <header className="app__header">
        <h1>현장 점검시트</h1>
        <span className={`status ${online ? 'status--online' : 'status--offline'}`}>
          {online ? '🟢 온라인' : '🔴 오프라인'}
        </span>
      </header>

      <main className="app__main">
        <p className="placeholder">
          프로젝트 골격(0단계)이 준비되었습니다.
          <br />
          다음 단계에서 점검시트 목록 / 생성 / 점검 입력 화면을 추가합니다.
        </p>
      </main>
    </div>
  );
}
