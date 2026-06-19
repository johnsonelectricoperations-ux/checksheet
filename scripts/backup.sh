#!/usr/bin/env bash
# 데이터 백업: Docker 볼륨(DB + 미디어)을 tar.gz 로 저장
# 사용법: ./scripts/backup.sh
# 볼륨 이름이 다르면: VOLUME=<이름> ./scripts/backup.sh
#
# compose 프로젝트명(기본: 디렉터리명 checksheet) + 볼륨명(checksheet-data)
# → 기본 볼륨 이름은 checksheet_checksheet-data

set -euo pipefail

VOLUME="${VOLUME:-checksheet_checksheet-data}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/backups"
mkdir -p "$OUT_DIR"

TS="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/checksheet-$TS.tar.gz"

if ! docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  echo "볼륨을 찾을 수 없습니다: $VOLUME" >&2
  echo "현재 볼륨 목록:" >&2
  docker volume ls >&2
  exit 1
fi

docker run --rm \
  -v "$VOLUME":/data:ro \
  -v "$OUT_DIR":/backup \
  alpine tar czf "/backup/$(basename "$FILE")" -C /data .

echo "백업 완료: $FILE"
echo "최근 백업:"
ls -1t "$OUT_DIR" | head -5
