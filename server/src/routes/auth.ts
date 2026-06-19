import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { authenticate, createSession, deleteSession } from '../repos/users.js';

const router = Router();

// 로그인
router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
  }
  const user = authenticate(username, password);
  if (!user) return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  const { token, expiresAt } = createSession(user.id);
  res.json({ token, expiresAt, user });
});

// 로그아웃
router.post('/logout', requireAuth, (req, res) => {
  const h = req.header('authorization');
  if (h?.startsWith('Bearer ')) deleteSession(h.slice(7));
  res.json({ ok: true });
});

// 현재 사용자
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
