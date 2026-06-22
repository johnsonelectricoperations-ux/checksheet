#!/usr/bin/env bash
# [오프라인 서버 PC에서 실행]
# 전송받은 이미지 묶음을 도커에 적재한다 (인터넷 불필요).
# 사용법: ./scripts/load-images.sh [이미지파일.tar.gz]
#   기본값: dist-images/checksheet-images.tar.gz

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="${1:-$ROOT/dist-images/checksheet-images.tar.gz}"

if [[ ! -f "$FILE" ]]; then
  echo "이미지 파일을 찾을 수 없습니다: $FILE" >&2
  exit 1
fi

echo "이미지 적재 중: $FILE"
gunzip -c "$FILE" | docker load

echo
echo "적재 완료. 다음 명령으로 실행하세요:"
echo "  docker compose -f docker-compose.prod.yml up -d"
