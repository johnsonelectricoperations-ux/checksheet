import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { createUser, listUsers } from '../repos/users.js';

const router = Router();

// 사용자 관리는 관리자 전용
router.use(requireAuth, requireAdmin);

router.get('/', (_req, res) => {
  res.json(listUsers());
});

router.post('/', (req, res) => {
  const { username, password, name, role } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호는 필수입니다.' });
  }
  if (role && role !== 'admin' && role !== 'worker') {
    return res.status(400).json({ error: "role 은 'admin' 또는 'worker' 여야 합니다." });
  }
  try {
    res.status(201).json(createUser({ username, password, name, role }));
  } catch (e) {
    // UNIQUE 제약 위반 등
    res.status(400).json({ error: '이미 존재하는 아이디이거나 잘못된 요청입니다.' });
  }
});

export default router;
