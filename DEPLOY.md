# 사내 서버 PC 배포 가이드

이 문서는 **회사 서버 PC에서 점검시트 시스템을 실행**하는 방법을 설명합니다.

---

## 핵심 개념: 가상환경(venv)처럼 격리 실행

이 프로젝트는 **Docker**로 실행합니다. Docker 컨테이너는 파이썬의 venv 같은
가상환경과 같은 개념(오히려 더 강력)으로, **서버 PC에 라이브러리(Node 등)를 직접
설치하지 않고** 격리된 환경에서 실행됩니다.

- 서버 PC에 필요한 것: **Docker 하나뿐** (Node, npm 등 설치 불필요)
- 모든 라이브러리는 컨테이너 이미지 안에 포함됨 → 서버 환경을 더럽히지 않음

> 서버 PC가 **인터넷이 안 되는** 경우(사내망 전용)에 맞춰, 인터넷 되는 PC에서
> 미리 준비한 뒤 서버로 옮기는 방법(아래 **시나리오 B**)을 따릅니다.

---

## 사전 준비 (서버 PC)

- **Docker Desktop**(Windows) 또는 **Docker Engine + Docker Compose**(Linux) 설치
  - 설치 파일은 인터넷 되는 PC에서 받아 USB 등으로 옮겨 설치할 수 있습니다.

---

## 시나리오 A — 서버 PC가 인터넷이 되는 경우 (가장 간단)

1. 이 저장소 전체를 서버 PC로 복사 (git clone 또는 zip 다운로드)
2. HTTPS 인증서 생성 (서버 IP 입력):
   ```bash
   ./scripts/generate-cert.sh 192.168.0.50
   ```
3. 실행:
   ```bash
   docker compose up -d --build
   ```
4. 태블릿에서 `https://192.168.0.50:8443` 접속

끝. 라이브러리 설치/빌드는 전부 컨테이너 안에서 자동으로 처리됩니다.

> 💡 **서버를 잠깐만 인터넷에 연결해 설치하는 경우** — 인터넷 연결 시 IP 와 사내망 IP 가
> 다를 수 있습니다. 인증서는 **태블릿이 실제 접속하는 사내망 IP** 로 만들어야 합니다.
> 자세한 내용은 아래 [IP 가 바뀌는 경우](#ip-가-바뀌는-경우-인증서) 참고.

---

## IP 가 바뀌는 경우 (인증서)

HTTPS 인증서는 **IP(또는 호스트명)에 묶여서** 만들어집니다. 인증서를 만든 주소와
실제 접속 주소가 다르면 브라우저 보안 경고가 납니다.

### 원칙
- 인증서는 **태블릿이 실제로 접속하는 사내망 IP** 기준으로 만든다. (인증서 생성에 인터넷은 불필요)
- 인터넷 연결은 설치·빌드용 잠깐일 뿐, 운영은 사내망 IP 로 한다.

### 권장: 서버에 고정(static) IP 지정
사내망에서 IP 가 DHCP 로 계속 바뀌면 인증서가 깨지고 태블릿 설정도 다시 해야 합니다.
**서버 PC 에 사내망 고정 IP** 를 지정하면(전산 담당 요청) 이 문제가 사라집니다.

### 여러 IP 를 하나의 인증서에 넣기 (가장 편함)
인터넷 IP·사내망 IP·호스트명을 모두 넣어두면 어느 주소로 접속해도 경고가 없습니다.
`localhost`/`127.0.0.1` 은 자동 포함됩니다.

```bash
# 사내망 IP 하나
./scripts/generate-cert.sh 192.168.0.50

# 여러 개 함께 (인터넷IP + 사내망IP + 호스트명)
./scripts/generate-cert.sh 192.168.0.50 10.0.0.50 checksheet
```

### 이미 실행 중에 인증서를 다시 만들었다면
웹 컨테이너를 재시작해야 새 인증서가 적용됩니다.

```bash
docker compose restart web
# (오프라인 서버는) docker compose -f docker-compose.prod.yml restart web
```

> 정리: **① 인터넷 연결로 설치·빌드 → ② 사내망 전환 + 고정 IP 확인 →
> ③ 사내망 IP 로 인증서 생성 → ④ `docker compose restart web` → ⑤ 태블릿 접속.**

---

## 시나리오 B — 서버 PC가 인터넷이 안 되는 경우 (사내망 전용) ★

서버에서는 빌드/다운로드를 할 수 없으므로, **인터넷 되는 PC에서 이미지를 만들어
파일로 옮긴 뒤** 서버에서 실행합니다.

### 1단계 — 인터넷 되는 PC에서 (준비)

#### (1) 필요한 프로그램 설치

- **Docker Desktop** — <https://www.docker.com/products/docker-desktop> 에서 받아 설치 후 실행
- **Git** (선택) — <https://git-scm.com> 에서 설치 *(ZIP 으로 받으면 Git 없이도 가능)*

#### (2) GitHub 에서 파일 받기

> ⚠️ 작업한 코드는 **`claude/epic-brown-v38qr4`** 브랜치에 있습니다. 반드시 이 브랜치를 받으세요.

**방법 A — Git 사용 (권장)**
```bash
git clone https://github.com/johnsonelectricoperations-ux/checksheet.git
cd checksheet
git checkout claude/epic-brown-v38qr4
```

**방법 B — ZIP 다운로드 (Git 없이)**
1. 브라우저에서 GitHub 저장소 접속
2. 브랜치를 **`claude/epic-brown-v38qr4`** 로 변경
3. 초록색 `Code` 버튼 → `Download ZIP`
4. 압축을 풀고 그 폴더로 이동

#### (3) 이미지 빌드 + 묶기

폴더 안에서 실행 (Docker 가 실행 중이어야 함):
```bash
./scripts/save-images.sh
```
- 인터넷에서 필요한 라이브러리·베이스 이미지를 받아 **컨테이너 이미지 안에 모두 담습니다.**
- 완료되면 **`dist-images/checksheet-images.tar.gz`** 가 생성됩니다 (서버로 옮길 핵심 파일).

> Windows 에서 `./scripts/save-images.sh` 가 실행되지 않으면 **Git Bash** 로 실행하거나,
> 스크립트 안의 명령 두 줄을 직접 실행하세요:
> ```bash
> docker compose build
> docker save checksheet-server:latest checksheet-web:latest | gzip > dist-images/checksheet-images.tar.gz
> ```

### 2단계 — 서버 PC로 복사할 파일

USB/사내 공유폴더로 아래 파일들을 서버 PC의 한 폴더에 복사합니다:

```
checksheet/
├─ dist-images/checksheet-images.tar.gz   ← 준비한 이미지 묶음
├─ docker-compose.prod.yml                ← 오프라인 실행용 구성
└─ scripts/
   ├─ load-images.sh
   ├─ generate-cert.sh
   ├─ backup.sh
   └─ restore.sh
```

> 소스코드 전체를 다 옮길 필요는 없습니다. 위 파일들만 있으면 됩니다.

### 3단계 — 서버 PC에서 (실행)

```bash
# 1) 이미지 적재 (인터넷 불필요)
./scripts/load-images.sh

# 2) HTTPS 인증서 생성 (서버 IP 입력)
./scripts/generate-cert.sh 192.168.0.50

# 3) 실행
docker compose -f docker-compose.prod.yml up -d
```

4. 태블릿에서 `https://192.168.0.50:8443` 접속

---

## 실행 후 확인

- 웹: `https://<서버IP>:8443` (HTTP `:8080` 으로 와도 자동 HTTPS 전환)
- 최초 관리자 계정: **`admin` / `admin123`** → **반드시 비밀번호 변경**
- 자체 서명 인증서이므로 태블릿에서 처음엔 보안 경고 → `certs/server.crt` 를
  태블릿에 신뢰된 인증서로 설치하면 경고가 사라집니다.

---

## 운영 명령 모음

```bash
# 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 보기
docker compose -f docker-compose.prod.yml logs -f

# 중지
docker compose -f docker-compose.prod.yml down

# 재시작 (PC 재부팅 시 자동 시작됨: restart: unless-stopped)
docker compose -f docker-compose.prod.yml up -d

# 데이터 백업 / 복원
./scripts/backup.sh
./scripts/restore.sh backups/checksheet-YYYYmmdd-HHMMSS.tar.gz
```

---

## 업데이트(새 버전 배포) 방법

1. 인터넷 PC에서 최신 코드로 `./scripts/save-images.sh` 다시 실행
2. 새 `checksheet-images.tar.gz` 를 서버로 복사
3. 서버에서:
   ```bash
   ./scripts/load-images.sh
   docker compose -f docker-compose.prod.yml up -d
   ```
   데이터(볼륨)는 그대로 유지되고 앱만 교체됩니다.

---

## 부록 — Docker 없이 실행 (비권장)

Docker를 쓸 수 없는 환경이라면 Node.js 22 로 직접 실행할 수도 있습니다.
이때도 라이브러리는 **프로젝트 폴더 안(`node_modules`)에만** 설치되어 시스템을
더럽히지 않습니다(파이썬 venv 와 같은 격리).

```bash
# 백엔드
cd server && npm install && npm run build && DATA_DIR=./data npm start

# 프론트엔드 (빌드 후 정적 파일을 별도 웹서버로 서빙)
cd web && npm install && npm run build   # dist/ 생성
```

단, 이 방식은 ① HTTPS 를 직접 구성해야 하고(오프라인 기능 필수), ② 오프라인
서버에서는 `npm install` 이 불가하며, ③ `better-sqlite3` 네이티브 모듈이 서버와
동일 OS/아키텍처에서 빌드되어야 하는 제약이 있어 **Docker 방식을 권장**합니다.
