# 현장 점검시트 디지털화 시스템

종이로 작성하던 현장 점검시트를 태블릿 기반 프로그램으로 전환하는 사내 시스템.

- **여러 점검시트를 생성·관리** (PC·태블릿 어디서나 웹으로 작성), 태블릿에서 골라 불러와 점검
- WiFi가 불안정해도 **오프라인 저장 후 자동 동기화** (PWA + IndexedDB)
- 항목별 **사진·동영상 촬영·저장**
- 사내 PC 서버(인터넷 차단, 사내망 전용)에서 운영

> 점검시트 **생성·관리**는 큰 화면의 PC 브라우저에서, **현장 점검·촬영**은 태블릿에서
> 같은 웹 주소로 접속해 사용합니다.

> 기획/설계는 [`plan.md`](./plan.md), 진행 현황은 [`progress.md`](./progress.md),
> 세부 작업은 [`task.md`](./task.md) 참고.

---

## 프로젝트 구조

```
checksheet/
├─ server/          백엔드 (Node.js + Express + SQLite)
│  ├─ src/
│  │  ├─ index.ts       서버 진입점
│  │  ├─ config.ts      설정(포트/데이터 경로)
│  │  └─ db/            DB 연결 및 스키마
│  └─ Dockerfile
├─ web/             태블릿 PWA (React + TypeScript + Vite)
│  ├─ src/
│  └─ Dockerfile
├─ docker-compose.yml   사내 PC 일괄 실행
├─ plan.md / progress.md / task.md
```

---

## 개발 환경 실행

요구사항: Node.js 22+

### 백엔드

```bash
cd server
npm install
npm run migrate   # DB 스키마 초기화
npm run dev       # http://localhost:5008
```

헬스체크: `curl http://localhost:5008/api/health`

### 프론트엔드 (PWA)

```bash
cd web
npm install
npm run dev       # http://localhost:5173 (사내망의 태블릿에서도 접속 가능)
```

`/api` 요청은 백엔드(5008)로 프록시된다.

---

## 사내 PC 배포

> 📘 **전체 절차(오프라인 사내망, IP 변경, HTTPS 등)는 [`DEPLOY.md`](./DEPLOY.md) 참고.**

회사 정책에 맞춰 두 방식 중 하나를 고릅니다.

| 방식 | 언제 | 접속 |
|------|------|------|
| **A. Node.js (도커 없이)** | **보안상 도커 설치 불가**할 때 | `http://<서버IP>:5008` |
| **B. Docker** | 도커 설치가 가능할 때 | `https://<서버IP>:8443` |

### 방식 A — Node.js (도커 없이, Windows)

1. [Node.js LTS(22)](https://nodejs.org) 설치
2. **`setup-node.bat`** 더블클릭 (1회, 인터넷 연결 상태 — 설치+빌드)
3. **`start-node.bat`** 더블클릭 (실행)
4. 접속: `http://<서버IP>:5008`  (데이터는 `server/data` 폴더에 저장)

> Node 서버 하나가 웹 화면과 API 를 모두 제공합니다(nginx 불필요).
> 오프라인 기능까지 쓰려면 HTTPS 가 필요합니다 → DEPLOY.md 참고.

### 방식 B — Docker

```bash
# 인증서 생성 (HTTPS, 오프라인 기능에 필요)
./scripts/generate-cert.sh <서버IP>

# 실행
docker compose up -d --build
```

- 웹(HTTPS): `https://<서버IP>:8443` (HTTP `:8080` 은 자동 HTTPS 전환)
- 인증서 없이 빠르게 테스트만: `docker compose -f docker-compose.http.yml up -d --build` → `http://<서버IP>:5008`
- DB·미디어는 `checksheet-data` 볼륨에 영구 보관

### 로그인 / 권한

- 최초 실행 시 기본 관리자 계정이 생성됩니다: **`admin` / `admin123`** → **반드시 비밀번호 변경/계정 정리 필요**
- 역할
  - **관리자(admin)**: 점검시트 생성·수정·복제·비활성화, 참조자료 등록, 사용자 관리, 점검·결과 조회
  - **작업자(worker)**: 점검 실행, 결과 조회 (템플릿 편집 불가)
- 작업자 계정 추가는 관리자 권한으로 `POST /api/users` (이름/아이디/비밀번호/역할)

### 3. 태블릿에서 인증서 신뢰 (경고 제거)

자체 서명 인증서이므로 처음엔 브라우저 경고가 뜹니다.
`certs/server.crt` 를 각 태블릿/PC 에 "신뢰된 인증서"로 설치하면 경고 없이 사용할 수 있습니다.
(안드로이드: 설정 → 보안 → 인증서 설치)

> 개발 환경에서는 `localhost` 가 보안 컨텍스트로 취급되어 HTTPS 없이도 서비스워커가 동작합니다.

---

## 데이터 백업 / 복원

**방식 A (Node.js):** 모든 데이터는 `server/data` 폴더에 있습니다.
→ **`server/data` 폴더를 통째로 복사**하면 백업, 되돌려 넣으면 복원입니다.

**방식 B (Docker):** 데이터는 Docker 볼륨(`checksheet-data`)에 있습니다.

```bash
# 백업 (backups/checksheet-<timestamp>.tar.gz 생성)
./scripts/backup.sh

# 복원 (서비스 중지 후) — 기존 데이터를 덮어씀
docker compose down
./scripts/restore.sh backups/checksheet-20260619-120000.tar.gz
docker compose up -d
```

매일 자동 백업하려면 cron 에 등록하세요:

```bash
# 매일 새벽 2시 백업 (crontab -e)
0 2 * * * cd /path/to/checksheet && ./scripts/backup.sh >> backups/backup.log 2>&1
```

> 백업 파일은 정기적으로 **다른 PC/외장 매체로 복사**해 두는 것이 안전합니다(서버 PC 고장 대비).

---

## 개발 단계

| 단계 | 내용 | 상태 |
|------|------|------|
| 0 | 프로젝트 골격 (구조/DB/서버/PWA) | ✅ |
| 1 | 점검시트 템플릿 관리 (생성/목록/빌더) | 예정 |
| 2 | 점검 실행 + 사진·동영상 촬영 | 예정 |
| 3 | 오프라인 저장 + 자동 동기화 | 예정 |
| 4 | 수신자 등록 | 예정 |
| 5 | 결과 조회 | 예정 |
| 6 | 메일 발송 (사내 SMTP, 후속) | 보류 |
