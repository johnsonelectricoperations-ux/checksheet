@echo off
chcp 65001 >nul
REM 점검시트 시스템 시작 (HTTP 모드, Docker) - 더블클릭 실행
REM 처음 한 번은 인터넷 연결 상태에서 실행하세요(빌드).
cd /d "%~dp0"

echo ============================================
echo  점검시트 시스템을 시작합니다...
echo ============================================
docker compose -f docker-compose.http.yml up -d --build
if errorlevel 1 (
  echo.
  echo [오류] 시작에 실패했습니다. Docker Desktop 이 실행 중인지 확인하세요.
  pause
  exit /b 1
)

echo.
echo  상태:
docker compose -f docker-compose.http.yml ps

echo.
echo ============================================
echo  접속 주소:
echo    이 PC        : http://localhost:5008
echo    태블릿/다른PC : http://10.80.101.200:5008
echo  로그인: admin / admin123
echo ============================================
pause
