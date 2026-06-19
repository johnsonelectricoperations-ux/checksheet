import { Router } from 'express';
import multer from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import {
  addMedia,
  getInspection,
  listInspections,
  saveInspection,
} from '../repos/inspections.js';
import { getTemplate } from '../repos/templates.js';

const router = Router();

// 미디어 파일은 디스크(mediaDir)에 저장. 파일명은 UUID 로 충돌 방지.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.mediaDir),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname) || ''}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (동영상 대비)
});

// 점검 결과 저장 (online 직접 저장 / 추후 오프라인 동기화도 같은 엔드포인트 사용)
router.post('/', (req, res) => {
  const b = req.body ?? {};
  if (!b.id || !b.templateId) {
    return res.status(400).json({ error: 'id 와 templateId 는 필수입니다.' });
  }
  const template = getTemplate(b.templateId);
  if (!template) {
    return res.status(400).json({ error: '존재하지 않는 템플릿입니다.' });
  }
  // 클라이언트가 점검 시점 스냅샷을 보냈으면 그대로 보관(작업자가 본 그대로),
  // 없으면 현재 템플릿으로 스냅샷을 만든다.
  const snapshot =
    b.templateSnapshot && b.templateSnapshot.fields
      ? b.templateSnapshot
      : { title: template.title, version: template.version, fields: template.fields };
  const saved = saveInspection({
    id: b.id,
    templateId: b.templateId,
    templateVersion: Number(b.templateVersion ?? 1),
    inspector: b.inspector,
    answers: b.answers,
    templateSnapshot: snapshot,
    createdAt: b.createdAt,
  });
  res.status(201).json(saved);
});

router.get('/', (req, res) => {
  const templateId = typeof req.query.templateId === 'string' ? req.query.templateId : undefined;
  res.json(listInspections(templateId));
});

router.get('/:id', (req, res) => {
  const ins = getInspection(req.params.id);
  if (!ins) return res.status(404).json({ error: '점검 결과를 찾을 수 없습니다.' });
  res.json(ins);
});

// 항목별 미디어(사진/동영상) 업로드
router.post('/:id/media', upload.single('file'), (req, res) => {
  const inspection = getInspection(req.params.id);
  if (!inspection) return res.status(404).json({ error: '점검 결과를 먼저 저장하세요.' });
  if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });

  const { mediaId, fieldId, type, capturedAt } = req.body;
  if (!fieldId || (type !== 'photo' && type !== 'video')) {
    return res.status(400).json({ error: 'fieldId 와 type(photo|video) 이 필요합니다.' });
  }

  const media = addMedia({
    id: mediaId || randomUUID(),
    inspectionId: req.params.id,
    fieldId,
    type,
    mime: req.file.mimetype,
    size: req.file.size,
    filename: req.file.originalname,
    storagePath: join(config.mediaDir, req.file.filename),
    capturedAt,
  });
  res.status(201).json(media);
});

export default router;
