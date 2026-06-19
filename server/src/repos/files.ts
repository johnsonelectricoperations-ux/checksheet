// 범용 파일 저장소 (참조용 미디어 등)
import { db } from '../db/index.js';

export interface StoredFile {
  id: string;
  type: 'photo' | 'video';
  mime: string;
  size: number;
  filename: string;
  storagePath: string;
  createdAt: string;
}

export function addFile(file: Omit<StoredFile, 'createdAt'>): StoredFile {
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO files (id, type, mime, size, filename, storage_path, created_at)
     VALUES (@id, @type, @mime, @size, @filename, @storagePath, @createdAt)`,
  ).run({ ...file, createdAt });
  return { ...file, createdAt };
}

export function getFile(id: string): { storagePath: string; mime: string } | null {
  const row = db
    .prepare('SELECT storage_path, mime FROM files WHERE id = ?')
    .get(id) as { storage_path: string; mime: string } | undefined;
  return row ? { storagePath: row.storage_path, mime: row.mime } : null;
}
