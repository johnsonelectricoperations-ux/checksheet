import { useEffect, useState } from 'react';
import { usersApi } from '../api.js';
import type { AuthUser } from '../auth/session.js';

export default function Users() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // 새 계정 입력값
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'worker' | 'admin'>('worker');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호는 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      await usersApi.create({ username: username.trim(), name: name.trim(), password, role });
      setMsg(`'${username}' 계정을 만들었습니다.`);
      setUsername('');
      setName('');
      setPassword('');
      setRole('worker');
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page__bar">
        <h2>사용자 관리</h2>
      </div>

      <form className="user-form" onSubmit={addUser}>
        <h3 className="section">새 계정 만들기</h3>
        {error && <p className="error">{error}</p>}
        {msg && <p className="msg">{msg}</p>}
        <div className="user-form__row">
          <input placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as 'worker' | 'admin')}>
            <option value="worker">작업자 (입력/조회)</option>
            <option value="admin">관리자 (전체)</option>
          </select>
          <button className="btn btn--primary" disabled={saving}>
            {saving ? '생성 중…' : '계정 생성'}
          </button>
        </div>
      </form>

      <h3 className="section">계정 목록</h3>
      {loading && <p>불러오는 중…</p>}
      <ul className="card-list">
        {users.map((u) => (
          <li key={u.id} className="card">
            <div className="card__main">
              <div className="card__title">{u.name || u.username}</div>
              <div className="card__meta">
                아이디: {u.username} · {u.role === 'admin' ? '관리자' : '작업자'}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
