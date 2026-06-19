import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// DB 파일이 들어갈 디렉터리를 먼저 보장한 뒤 연결한다.
mkdirSync(dirname(config.dbPath), { recursive: true });
export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/** 컬럼이 없으면 추가한다 (기존 DB 호환용 경량 마이그레이션). */
function ensureColumn(table: string, column: string, definition: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** schema.sql 을 실행하여 테이블을 생성한다 (이미 있으면 무시) + 마이그레이션. */
export function initSchema(): void {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  // 결과 무결성: 점검 시점의 템플릿 항목 스냅샷
  ensureColumn('inspections', 'template_snapshot_json', "TEXT NOT NULL DEFAULT '{}'");
}
