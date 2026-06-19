-- 점검시트 디지털화 시스템 - 데이터베이스 스키마 (SQLite)
-- 0단계 골격: 향후 PostgreSQL 이전 가능하도록 표준 SQL 위주로 작성

-- 점검시트 템플릿
-- fields_json, recipients_json 은 노코드 빌더의 유연성을 위해 JSON 으로 보관
CREATE TABLE IF NOT EXISTS templates (
  id              TEXT PRIMARY KEY,           -- UUID
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  version         INTEGER NOT NULL DEFAULT 1, -- 수정 시 증가, 과거 결과 보존
  fields_json     TEXT NOT NULL DEFAULT '[]', -- [{id,type,label,required,criteria,order,mediaOptions}]
  recipients_json TEXT NOT NULL DEFAULT '[]', -- ["a@x.com", ...]  (발송은 후속 단계)
  active          INTEGER NOT NULL DEFAULT 1, -- 1=사용, 0=비활성
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 점검 결과
-- id 는 태블릿에서 생성한 UUID 를 그대로 사용 → 중복 동기화 방지
CREATE TABLE IF NOT EXISTS inspections (
  id               TEXT PRIMARY KEY,          -- 태블릿 생성 UUID
  template_id      TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  inspector        TEXT NOT NULL DEFAULT '',
  answers_json     TEXT NOT NULL DEFAULT '{}',-- { fieldId: value }
  created_at       TEXT NOT NULL,             -- 태블릿 작성 시각
  received_at      TEXT NOT NULL,             -- 서버 수신 시각
  sync_status      TEXT NOT NULL DEFAULT 'completed',
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- 미디어 파일 (사진/동영상) - 대용량이므로 파일은 디스크, DB 에는 메타데이터만
CREATE TABLE IF NOT EXISTS media_files (
  id            TEXT PRIMARY KEY,             -- UUID
  inspection_id TEXT NOT NULL,
  field_id      TEXT NOT NULL,                -- 어떤 점검 항목에 속하는지
  type          TEXT NOT NULL,                -- 'photo' | 'video'
  mime          TEXT NOT NULL DEFAULT '',
  size          INTEGER NOT NULL DEFAULT 0,
  filename      TEXT NOT NULL DEFAULT '',
  storage_path  TEXT NOT NULL,                -- 서버 파일 스토리지 경로
  captured_at   TEXT,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (inspection_id) REFERENCES inspections(id)
);

-- 범용 파일 저장소 (점검 항목의 참조용 사진/동영상 등)
-- 점검 결과 미디어(media_files)와 달리 템플릿 작성 시점에 업로드되어 특정 결과에 묶이지 않는다.
CREATE TABLE IF NOT EXISTS files (
  id           TEXT PRIMARY KEY,             -- UUID
  type         TEXT NOT NULL DEFAULT 'photo',-- 'photo' | 'video'
  mime         TEXT NOT NULL DEFAULT '',
  size         INTEGER NOT NULL DEFAULT 0,
  filename     TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

-- 사용자 (관리자 / 작업자)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,             -- UUID
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,                -- scrypt: salt:hash
  role          TEXT NOT NULL DEFAULT 'worker', -- 'admin' | 'worker'
  created_at    TEXT NOT NULL
);

-- 로그인 세션 토큰
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_inspections_template ON inspections(template_id);
CREATE INDEX IF NOT EXISTS idx_media_inspection ON media_files(inspection_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
