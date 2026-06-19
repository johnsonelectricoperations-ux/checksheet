// 서버 설정 (환경변수로 덮어쓸 수 있음)
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR)
  : resolve(__dirname, '../data');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  dataDir,
  dbPath: process.env.DB_PATH ?? join(dataDir, 'checksheet.db'),
  // 사진/동영상 등 미디어 파일 저장 위치 (대용량 → 파일 스토리지)
  mediaDir: process.env.MEDIA_DIR ?? join(dataDir, 'media'),
};
