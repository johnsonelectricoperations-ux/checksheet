import { Router } from 'express';
import {
  createTemplate,
  duplicateTemplate,
  getTemplate,
  listTemplates,
  setActive,
  updateTemplate,
} from '../repos/templates.js';
import type { Field, FieldType } from '../types.js';

const router = Router();

const FIELD_TYPES: FieldType[] = [
  'check',
  'number',
  'text',
  'date',
  'select',
  'photo',
  'video',
];

// 입력 검증: 제목 필수, 항목 유형 유효성
function validate(body: unknown): { ok: true; data: any } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: '잘못된 요청 본문입니다.' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b.title !== 'string' || b.title.trim() === '') {
    return { ok: false, error: '제목은 필수입니다.' };
  }
  const recipients = (b.recipients ?? []) as unknown;
  if (recipients !== undefined) {
    if (!Array.isArray(recipients)) {
      return { ok: false, error: 'recipients 는 배열이어야 합니다.' };
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const r of recipients) {
      if (typeof r !== 'string' || !emailRe.test(r)) {
        return { ok: false, error: `올바르지 않은 이메일 형식: ${r}` };
      }
    }
  }
  const fields = (b.fields ?? []) as Field[];
  if (!Array.isArray(fields)) {
    return { ok: false, error: 'fields 는 배열이어야 합니다.' };
  }
  for (const f of fields) {
    if (!f.id || typeof f.label !== 'string') {
      return { ok: false, error: '각 항목은 id 와 label 이 필요합니다.' };
    }
    if (!FIELD_TYPES.includes(f.type)) {
      return { ok: false, error: `알 수 없는 항목 유형: ${f.type}` };
    }
  }
  return { ok: true, data: b };
}

// 목록 (?includeInactive=1 로 비활성 포함)
router.get('/', (req, res) => {
  const includeInactive = req.query.includeInactive === '1';
  res.json(listTemplates(includeInactive));
});

// 단건 조회
router.get('/:id', (req, res) => {
  const tpl = getTemplate(req.params.id);
  if (!tpl) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
  res.json(tpl);
});

// 생성
router.post('/', (req, res) => {
  const v = validate(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  res.status(201).json(createTemplate(v.data));
});

// 수정 (version 증가)
router.put('/:id', (req, res) => {
  const v = validate(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const updated = updateTemplate(req.params.id, v.data);
  if (!updated) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
  res.json(updated);
});

// 복제
router.post('/:id/duplicate', (req, res) => {
  const dup = duplicateTemplate(req.params.id);
  if (!dup) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
  res.status(201).json(dup);
});

// 활성/비활성 토글
router.patch('/:id/active', (req, res) => {
  const active = req.body?.active;
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active(boolean) 가 필요합니다.' });
  }
  const updated = setActive(req.params.id, active);
  if (!updated) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
  res.json(updated);
});

export default router;
