@echo off
REM Stop (Docker).
cd /d "%~dp0"

echo Stopping Checksheet system...
docker compose -f docker-compose.http.yml down
echo.
echo Stopped. (Data is kept.)
pause
