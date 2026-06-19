import express from 'express';
import cors from 'cors';
import { mkdirSync } from 'node:fs';
import { config } from './config.js';
import { initSchema } from './db/index.js';
import { seedAdmin } from './repos/users.js';
import { requireAuth } from './auth.js';

// 데이터 디렉터리 보장
mkdirSync(config.dataDir, { recursive: true });
mkdirSync(config.mediaDir, { recursive: true });

// DB 스키마 초기화 + 기본 관리자 시드
initSchema();
seedAdmin();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// 헬스체크 (태블릿의 온라인 여부 판단에도 사용) - 인증 불필요
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 라우트
import auth from './routes/auth.js';
import users from './routes/users.js';
import templates from './routes/templates.js';
import inspections from './routes/inspections.js';
import media from './routes/media.js';
import files from './routes/files.js';

// 인증 불필요: 로그인
app.use('/api/auth', auth);

// 이하 모든 API 는 로그인 필요 (세부 권한은 각 라우터에서)
app.use('/api/users', users);
app.use('/api/templates', requireAuth, templates);
app.use('/api/inspections', requireAuth, inspections);
app.use('/api/media', requireAuth, media);
app.use('/api/files', requireAuth, files);

app.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port} 에서 실행 중`);
  console.log(`[server] DB: ${config.dbPath}`);
  console.log(`[server] 미디어 저장 경로: ${config.mediaDir}`);
});
