import { Router } from 'express';
import multer from 'multer';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { addFile, getFile } from '../repos/files.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.mediaDir),
  filename: (_req, file, cb) => cb(null, `ref-${randomUUID()}${extname(file.originalname) || ''}`),
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

// 참조용 파일 업로드 (템플릿 항목 설명에 붙는 사진/동영상)
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
  const type = req.body.type === 'video' ? 'video' : 'photo';
  const stored = addFile({
    id: randomUUID(),
    type,
    mime: req.file.mimetype,
    size: req.file.size,
    filename: req.file.originalname,
    storagePath: join(config.mediaDir, req.file.filename),
  });
  res.status(201).json({ id: stored.id, type: stored.type, url: `/api/files/${stored.id}` });
});

// 파일 제공
router.get('/:id', (req, res) => {
  const info = getFile(req.params.id);
  if (!info || !existsSync(info.storagePath)) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }
  res.type(info.mime);
  res.sendFile(info.storagePath);
});

export default router;
