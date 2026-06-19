// DB 초기화 스크립트: npm run migrate 로 실행
import { initSchema } from './index.js';
import { config } from '../config.js';

initSchema();
console.log(`[migrate] 스키마 초기화 완료 → ${config.dbPath}`);
