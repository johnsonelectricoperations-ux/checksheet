@echo off
REM Start (Docker, HTTP mode). First run needs internet (build).
cd /d "%~dp0"

echo Starting Checksheet system...
docker compose -f docker-compose.http.yml up -d --build
if errorlevel 1 (
  echo.
  echo [ERROR] Start failed. Is Docker Desktop running?
  pause
  exit /b 1
)

echo.
echo Status:
docker compose -f docker-compose.http.yml ps

echo.
echo ============================================
echo  URL:
echo    this PC      : http://localhost:5008
echo    tablet/other : http://10.80.101.200:5008
echo  Login: admin / admin123
echo ============================================
pause
