// 인증/권한 미들웨어
import type { NextFunction, Request, Response } from 'express';
import { getUserByToken, type User } from './repos/users.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

function tokenFrom(req: Request): string | null {
  const h = req.header('authorization');
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  // <img>/<video> 등 헤더를 못 보내는 경우를 위해 쿼리 토큰도 허용 (GET 미디어 제공용)
  if (typeof req.query.token === 'string') return req.query.token;
  return null;
}

// 로그인 필요
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = tokenFrom(req);
  const user = token ? getUserByToken(token) : null;
  if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' });
  req.user = user;
  next();
}

// 관리자 권한 필요
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
}
