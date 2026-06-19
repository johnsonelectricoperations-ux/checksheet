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

## 사내 PC 배포 (Docker)

```bash
docker compose up -d --build
```

- 웹: `http://<서버IP>:8080`
- API: `http://<서버IP>:5008`
- DB와 미디어 파일은 `checksheet-data` 볼륨에 영구 보관

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
