@echo off
REM 점검시트 시스템 중지 - 더블클릭 실행
cd /d "%~dp0"

echo 점검시트 시스템을 중지합니다...
docker compose -f docker-compose.http.yml down
echo.
echo 중지되었습니다. (데이터는 그대로 보관됩니다)
pause
