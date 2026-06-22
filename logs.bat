@echo off
REM 점검시트 시스템 로그 보기 - 더블클릭 실행 (창 닫으면 종료)
cd /d "%~dp0"
docker compose -f docker-compose.http.yml logs -f
