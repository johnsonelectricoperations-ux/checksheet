#!/usr/bin/env bash
# 사내망용 자체 서명 인증서 생성 스크립트
# 사용법: ./scripts/generate-cert.sh <서버IP또는호스트명>
# 예:     ./scripts/generate-cert.sh 192.168.0.50
#
# PWA의 서비스워커(오프라인 기능)는 localhost 외에는 HTTPS 에서만 동작하므로
# 사내 IP 로 접속하려면 이 인증서로 HTTPS 를 구성해야 한다.

set -euo pipefail

HOST="${1:-}"
if [[ -z "$HOST" ]]; then
  echo "사용법: $0 <서버IP또는호스트명>" >&2
  exit 1
fi

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$OUT_DIR"

# IP 인지 호스트명인지 구분하여 SAN 작성
if [[ "$HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  SAN="IP:${HOST}"
else
  SAN="DNS:${HOST}"
fi

openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
  -keyout "$OUT_DIR/server.key" \
  -out "$OUT_DIR/server.crt" \
  -subj "/CN=${HOST}/O=Checksheet" \
  -addext "subjectAltName=${SAN}"

echo "인증서 생성 완료:"
echo "  - $OUT_DIR/server.crt"
echo "  - $OUT_DIR/server.key"
echo
echo "다음: docker compose up -d --build 로 HTTPS(8443) 접속"
echo "태블릿/PC 브라우저에서 server.crt 를 신뢰된 인증서로 등록하면 경고가 사라집니다."
