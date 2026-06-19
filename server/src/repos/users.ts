// 사용자 / 세션 저장소 + 비밀번호 해싱 (의존성 없이 Node crypto scrypt 사용)
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '../db/index.js';

export type Role = 'admin' | 'worker';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: string;
}

interface UserRow {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  role: string;
  created_at: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const calc = scryptSync(password, salt, 64);
  const orig = Buffer.from(hash, 'hex');
  return calc.length === orig.length && timingSafeEqual(calc, orig);
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as Role,
    createdAt: row.created_at,
  };
}

export function createUser(input: {
  username: string;
  password: string;
  name?: string;
  role?: Role;
}): User {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, username, name, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.username, input.name ?? '', hashPassword(input.password), input.role ?? 'worker', now);
  return getUser(id)!;
}

export function getUser(id: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export function listUsers(): User[] {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
  return rows.map(toUser);
}

export function authenticate(username: string, password: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | UserRow
    | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return toUser(row);
}

// ── 세션 ──
const SESSION_DAYS = 30; // 현장 오프라인 사용 고려해 길게 유지

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(token, userId, expiresAt, new Date(now).toISOString());
  return { token, expiresAt };
}

export function getUserByToken(token: string): User | null {
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as
    | { user_id: string; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return getUser(row.user_id);
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// 최초 실행 시 관리자 계정이 없으면 기본 관리자 생성
export function seedAdmin(): void {
  const count = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  if (count === 0) {
    createUser({ username: 'admin', password: 'admin123', name: '관리자', role: 'admin' });
    console.log('[auth] 기본 관리자 생성: admin / admin123  (반드시 비밀번호를 변경하세요)');
  }
}
