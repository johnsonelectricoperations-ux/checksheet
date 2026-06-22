#!/usr/bin/env bash
# 사내망용 자체 서명 인증서 생성 스크립트
# 사용법: ./scripts/generate-cert.sh <IP또는호스트명> [추가IP/호스트명 ...]
#   예 1) 사내망 IP 하나:        ./scripts/generate-cert.sh 192.168.0.50
#   예 2) 여러 IP/호스트 함께:    ./scripts/generate-cert.sh 192.168.0.50 10.0.0.50 checksheet
#
# 여러 개를 넣으면 인증서 하나로 어느 주소로 접속해도 경고가 나지 않는다.
# (인터넷 연결 IP 와 사내망 IP 가 다를 때 둘 다 넣어두면 편함)
# localhost / 127.0.0.1 은 자동 포함된다.
#
# PWA 의 서비스워커(오프라인 기능)는 localhost 외에는 HTTPS 에서만 동작하므로
# 사내 IP 로 접속하려면 이 인증서로 HTTPS 를 구성해야 한다.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "사용법: $0 <IP또는호스트명> [추가IP/호스트명 ...]" >&2
  exit 1
fi

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$OUT_DIR"

# SAN 목록 구성 (입력값 + localhost/127.0.0.1 기본 포함)
SANS=()
add_san() {
  local host="$1"
  if [[ "$host" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    SANS+=("IP:${host}")
  else
    SANS+=("DNS:${host}")
  fi
}
for h in "$@"; do add_san "$h"; done
add_san "localhost"
add_san "127.0.0.1"

# 배열을 콤마로 연결
SAN_STR=$(IFS=,; echo "${SANS[*]}")
CN="$1"

openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
  -keyout "$OUT_DIR/server.key" \
  -out "$OUT_DIR/server.crt" \
  -subj "/CN=${CN}/O=Checksheet" \
  -addext "subjectAltName=${SAN_STR}"

echo "인증서 생성 완료 (SAN: ${SAN_STR})"
echo "  - $OUT_DIR/server.crt"
echo "  - $OUT_DIR/server.key"
echo
echo "도커가 이미 떠 있으면 웹 컨테이너를 재시작해 새 인증서를 적용하세요:"
echo "  docker compose restart web        (또는 -f docker-compose.prod.yml)"
echo
echo "태블릿/PC 에 server.crt 를 신뢰된 인증서로 설치하면 경고가 사라집니다."
