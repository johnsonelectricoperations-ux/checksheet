// 로그인 세션 저장 (localStorage) + 변경 구독
// 오프라인에서도 토큰이 유지되어 동기화가 동작한다.

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'worker';
}

const TOKEN_KEY = 'cs.authToken';
const USER_KEY = 'cs.authUser';

type Listener = (user: AuthUser | null) => void;
const listeners = new Set<Listener>();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emit();
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(getUser());
  return () => listeners.delete(listener);
}

function emit() {
  const u = getUser();
  for (const l of listeners) l(u);
}
