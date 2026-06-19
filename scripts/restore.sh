#!/usr/bin/env bash
# 데이터 복원: 백업 tar.gz 를 Docker 볼륨으로 되돌린다.
# 사용법: ./scripts/restore.sh backups/checksheet-YYYYmmdd-HHMMSS.tar.gz
# 볼륨 이름이 다르면: VOLUME=<이름> ./scripts/restore.sh <파일>
#
# ⚠️ 기존 데이터를 덮어씁니다. 먼저 docker compose down 으로 서비스를 멈추세요.

set -euo pipefail

FILE="${1:-}"
VOLUME="${VOLUME:-checksheet_checksheet-data}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "사용법: $0 <백업파일.tar.gz>" >&2
  exit 1
fi

read -r -p "볼륨 '$VOLUME' 의 기존 데이터를 덮어씁니다. 계속할까요? (yes 입력) " ANS
if [[ "$ANS" != "yes" ]]; then
  echo "취소되었습니다."
  exit 0
fi

docker volume create "$VOLUME" >/dev/null

ABS="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
docker run --rm \
  -v "$VOLUME":/data \
  -v "$(dirname "$ABS")":/backup:ro \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename "$ABS") -C /data"

echo "복원 완료. docker compose up -d 로 서비스를 다시 시작하세요."
