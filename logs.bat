@echo off
chcp 65001 >nul
REM 점검시트 시스템 로그 보기 (Docker) - 더블클릭 실행 (창 닫으면 종료)
cd /d "%~dp0"
docker compose -f docker-compose.http.yml logs -f
