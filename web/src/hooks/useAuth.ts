import { useEffect, useState } from 'react';
import { subscribe, type AuthUser } from '../auth/session.js';

// 로그인 사용자 상태 구독
export function useAuth(): { user: AuthUser | null; isAdmin: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => subscribe(setUser), []);
  return { user, isAdmin: user?.role === 'admin' };
}
