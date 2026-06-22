// 서버 설정 (환경변수로 덮어쓸 수 있음)
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR)
  : resolve(__dirname, '../data');

export const config = {
  port: Number(process.env.PORT ?? 5008),
  dataDir,
  dbPath: process.env.DB_PATH ?? join(dataDir, 'checksheet.db'),
  // 사진/동영상 등 미디어 파일 저장 위치 (대용량 → 파일 스토리지)
  mediaDir: process.env.MEDIA_DIR ?? join(dataDir, 'media'),
  // 빌드된 웹(PWA) 정적 파일 경로. 있으면 같은 서버가 웹도 제공(도커/nginx 불필요)
  webDir: process.env.WEB_DIR ?? resolve(__dirname, '../../web/dist'),
  // HTTPS: 인증서 파일이 지정되면 https 로 서비스 (오프라인 기능용)
  tlsCertFile: process.env.TLS_CERT_FILE,
  tlsKeyFile: process.env.TLS_KEY_FILE,
};
