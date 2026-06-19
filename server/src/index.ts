import express from 'express';
import cors from 'cors';
import { mkdirSync } from 'node:fs';
import { config } from './config.js';
import { initSchema } from './db/index.js';

// 데이터 디렉터리 보장
mkdirSync(config.dataDir, { recursive: true });
mkdirSync(config.mediaDir, { recursive: true });

// DB 스키마 초기화
initSchema();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// 헬스체크 (태블릿의 온라인 여부 판단에도 사용)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 라우트
import templates from './routes/templates.js';
app.use('/api/templates', templates);
// import inspections from './routes/inspections.js'; // 2단계
// app.use('/api/inspections', inspections);

app.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port} 에서 실행 중`);
  console.log(`[server] DB: ${config.dbPath}`);
  console.log(`[server] 미디어 저장 경로: ${config.mediaDir}`);
});
