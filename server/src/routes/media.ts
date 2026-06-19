import { Router } from 'express';
import { existsSync } from 'node:fs';
import { getMediaStoragePath } from '../repos/inspections.js';

const router = Router();

// 저장된 미디어 파일 제공 (결과 조회 시 사용)
router.get('/:id', (req, res) => {
  const info = getMediaStoragePath(req.params.id);
  if (!info || !existsSync(info.storagePath)) {
    return res.status(404).json({ error: '미디어를 찾을 수 없습니다.' });
  }
  res.type(info.mime);
  res.sendFile(info.storagePath);
});

export default router;
