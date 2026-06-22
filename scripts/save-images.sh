#!/usr/bin/env bash
# [인터넷 되는 PC에서 실행]
# 도커 이미지를 빌드하고 하나의 파일로 묶는다 → 오프라인 서버로 전송용.
# 사용법: ./scripts/save-images.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/dist-images"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/checksheet-images.tar.gz"

echo "[1/2] 이미지 빌드 중… (인터넷 필요)"
docker compose build

echo "[2/2] 이미지 묶는 중…"
docker save checksheet-server:latest checksheet-web:latest | gzip > "$OUT"

echo
echo "완료: $OUT"
echo
echo "다음 파일들을 서버 PC로 복사하세요:"
echo "  - $OUT"
echo "  - docker-compose.prod.yml"
echo "  - scripts/ (load-images.sh, generate-cert.sh, backup.sh, restore.sh)"
