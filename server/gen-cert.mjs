// 도커/openssl 없이 자체 서명 인증서 생성 (Node 만으로)
// 사용: node server/gen-cert.mjs <서버IP> [추가IP/호스트명 ...]
// 결과: certs/server.crt, certs/server.key (프로젝트 루트의 certs 폴더)
import selfsigned from 'selfsigned';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('사용법: node server/gen-cert.mjs <서버IP> [추가IP/호스트명 ...]');
  process.exit(1);
}

// SAN(주소 목록) 구성: 입력값 + localhost/127.0.0.1 자동 포함
const isIp = (s) => /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(s);
const altNames = [];
for (const a of args) altNames.push(isIp(a) ? { type: 7, ip: a } : { type: 2, value: a });
altNames.push({ type: 2, value: 'localhost' });
altNames.push({ type: 7, ip: '127.0.0.1' });

const pems = selfsigned.generate([{ name: 'commonName', value: args[0] }], {
  days: 3650,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [{ name: 'subjectAltName', altNames }],
});

// server/gen-cert.mjs 기준 ../certs = 프로젝트 루트/certs
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'certs');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'server.crt'), pems.cert);
writeFileSync(join(outDir, 'server.key'), pems.private);

console.log('인증서 생성 완료:');
console.log('  ' + join(outDir, 'server.crt'));
console.log('  ' + join(outDir, 'server.key'));
console.log('대상 주소: ' + args.join(', ') + ', localhost, 127.0.0.1');
