// 점검 결과 저장소
import { db } from '../db/index.js';
import type { Inspection, MediaFile, TemplateSnapshot } from '../types.js';

interface InspectionRow {
  id: string;
  template_id: string;
  template_version: number;
  inspector: string;
  answers_json: string;
  template_snapshot_json: string;
  created_at: string;
  received_at: string;
  sync_status: string;
}

interface MediaRow {
  id: string;
  inspection_id: string;
  field_id: string;
  type: string;
  mime: string;
  size: number;
  filename: string;
  storage_path: string;
  captured_at: string | null;
  created_at: string;
}

function rowToInspection(row: InspectionRow, media: MediaFile[]): Inspection {
  return {
    id: row.id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    inspector: row.inspector,
    answers: JSON.parse(row.answers_json),
    templateSnapshot: JSON.parse(row.template_snapshot_json || '{}') as TemplateSnapshot,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    syncStatus: row.sync_status,
    media,
  };
}

function mediaRowToMedia(row: MediaRow): MediaFile {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    fieldId: row.field_id,
    type: row.type as 'photo' | 'video',
    mime: row.mime,
    size: row.size,
    filename: row.filename,
    capturedAt: row.captured_at ?? undefined,
    createdAt: row.created_at,
  };
}

function getMedia(inspectionId: string): MediaFile[] {
  const rows = db
    .prepare('SELECT * FROM media_files WHERE inspection_id = ? ORDER BY created_at')
    .all(inspectionId) as MediaRow[];
  return rows.map(mediaRowToMedia);
}

export interface InspectionInput {
  id: string; // 태블릿 생성 UUID
  templateId: string;
  templateVersion: number;
  inspector?: string;
  answers?: Record<string, unknown>;
  templateSnapshot?: TemplateSnapshot;
  createdAt?: string;
}

export function getInspection(id: string): Inspection | null {
  const row = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id) as
    | InspectionRow
    | undefined;
  return row ? rowToInspection(row, getMedia(id)) : null;
}

export function listInspections(templateId?: string): Inspection[] {
  const rows = (
    templateId
      ? db
          .prepare('SELECT * FROM inspections WHERE template_id = ? ORDER BY created_at DESC')
          .all(templateId)
      : db.prepare('SELECT * FROM inspections ORDER BY created_at DESC').all()
  ) as InspectionRow[];
  return rows.map((r) => rowToInspection(r, getMedia(r.id)));
}

// 점검 결과 저장 (idempotent: 같은 id 면 덮어쓰기 → 동기화 재시도 중복 방지)
export function saveInspection(input: InspectionInput): Inspection {
  const now = new Date().toISOString();
  const createdAt = input.createdAt ?? now;
  db.prepare(
    `INSERT INTO inspections (id, template_id, template_version, inspector, answers_json, template_snapshot_json, created_at, received_at, sync_status)
     VALUES (@id, @templateId, @templateVersion, @inspector, @answers, @snapshot, @createdAt, @receivedAt, 'completed')
     ON CONFLICT(id) DO UPDATE SET
       template_id = excluded.template_id,
       template_version = excluded.template_version,
       inspector = excluded.inspector,
       answers_json = excluded.answers_json,
       template_snapshot_json = excluded.template_snapshot_json,
       received_at = excluded.received_at`,
  ).run({
    id: input.id,
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    inspector: input.inspector ?? '',
    answers: JSON.stringify(input.answers ?? {}),
    snapshot: JSON.stringify(input.templateSnapshot ?? {}),
    createdAt,
    receivedAt: now,
  });
  return getInspection(input.id)!;
}

export interface MediaInput {
  id: string;
  inspectionId: string;
  fieldId: string;
  type: 'photo' | 'video';
  mime: string;
  size: number;
  filename: string;
  storagePath: string;
  capturedAt?: string;
}

export function addMedia(input: MediaInput): MediaFile {
  const now = new Date().toISOString();
  // 같은 id 의 미디어가 이미 있으면 무시 (동기화 재시도 중복 방지)
  db.prepare(
    `INSERT INTO media_files (id, inspection_id, field_id, type, mime, size, filename, storage_path, captured_at, created_at)
     VALUES (@id, @inspectionId, @fieldId, @type, @mime, @size, @filename, @storagePath, @capturedAt, @createdAt)
     ON CONFLICT(id) DO NOTHING`,
  ).run({
    id: input.id,
    inspectionId: input.inspectionId,
    fieldId: input.fieldId,
    type: input.type,
    mime: input.mime,
    size: input.size,
    filename: input.filename,
    storagePath: input.storagePath,
    capturedAt: input.capturedAt ?? null,
    createdAt: now,
  });
  const row = db.prepare('SELECT * FROM media_files WHERE id = ?').get(input.id) as MediaRow;
  return mediaRowToMedia(row);
}

export function getMediaStoragePath(mediaId: string): { storagePath: string; mime: string } | null {
  const row = db
    .prepare('SELECT storage_path, mime FROM media_files WHERE id = ?')
    .get(mediaId) as { storage_path: string; mime: string } | undefined;
  return row ? { storagePath: row.storage_path, mime: row.mime } : null;
}
