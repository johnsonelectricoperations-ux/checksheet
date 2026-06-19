// 템플릿 저장소 (DB 접근 계층)
import { randomUUID } from 'node:crypto';
import { db } from '../db/index.js';
import type { Field, Template } from '../types.js';

interface TemplateRow {
  id: string;
  title: string;
  description: string;
  version: number;
  fields_json: string;
  recipients_json: string;
  active: number;
  created_at: string;
  updated_at: string;
}

function rowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    version: row.version,
    fields: JSON.parse(row.fields_json) as Field[],
    recipients: JSON.parse(row.recipients_json) as string[],
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface TemplateInput {
  title: string;
  description?: string;
  fields?: Field[];
  recipients?: string[];
}

// 목록 조회 (기본은 활성 템플릿만, includeInactive 로 전체)
export function listTemplates(includeInactive = false): Template[] {
  const sql = includeInactive
    ? 'SELECT * FROM templates ORDER BY updated_at DESC'
    : 'SELECT * FROM templates WHERE active = 1 ORDER BY updated_at DESC';
  const rows = db.prepare(sql).all() as TemplateRow[];
  return rows.map(rowToTemplate);
}

export function getTemplate(id: string): Template | null {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as
    | TemplateRow
    | undefined;
  return row ? rowToTemplate(row) : null;
}

export function createTemplate(input: TemplateInput): Template {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO templates (id, title, description, version, fields_json, recipients_json, active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?, 1, ?, ?)`,
  ).run(
    id,
    input.title,
    input.description ?? '',
    JSON.stringify(input.fields ?? []),
    JSON.stringify(input.recipients ?? []),
    now,
    now,
  );
  return getTemplate(id)!;
}

// 수정 시 version 을 증가시켜 과거 점검 결과의 버전과 구분한다.
export function updateTemplate(id: string, input: TemplateInput): Template | null {
  const existing = getTemplate(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE templates
     SET title = ?, description = ?, version = ?, fields_json = ?, recipients_json = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    input.title,
    input.description ?? '',
    existing.version + 1,
    JSON.stringify(input.fields ?? existing.fields),
    JSON.stringify(input.recipients ?? existing.recipients),
    now,
    id,
  );
  return getTemplate(id);
}

// 복제 (새 id, version 1, 제목에 "(복사본)")
export function duplicateTemplate(id: string): Template | null {
  const src = getTemplate(id);
  if (!src) return null;
  return createTemplate({
    title: `${src.title} (복사본)`,
    description: src.description,
    fields: src.fields,
    recipients: src.recipients,
  });
}

// 비활성화 / 활성화
export function setActive(id: string, active: boolean): Template | null {
  const existing = getTemplate(id);
  if (!existing) return null;
  db.prepare('UPDATE templates SET active = ?, updated_at = ? WHERE id = ?').run(
    active ? 1 : 0,
    new Date().toISOString(),
    id,
  );
  return getTemplate(id);
}
