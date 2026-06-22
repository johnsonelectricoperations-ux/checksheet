@echo off
chcp 65001 >nul
REM [1회 실행] 도커 없이 Node.js 로 준비 - 라이브러리 설치 + 빌드
REM 인터넷 연결 상태에서 실행하세요. Node.js 22 가 설치되어 있어야 합니다.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [오류] Node.js 가 없습니다. https://nodejs.org 에서 LTS 설치 후 다시 실행하세요.
  pause
  exit /b 1
)

echo ============================================
echo  [1/2] 서버 라이브러리 설치 + 빌드
echo ============================================
cd /d "%~dp0server"
call npm install
if errorlevel 1 goto err
call npm run build
if errorlevel 1 goto err

echo ============================================
echo  [2/2] 웹 라이브러리 설치 + 빌드
echo ============================================
cd /d "%~dp0web"
call npm install
if errorlevel 1 goto err
call npm run build
if errorlevel 1 goto err

echo ============================================
echo  준비 완료! start-node.bat 으로 실행하세요.
echo ============================================
pause
exit /b 0

:err
echo.
echo [오류] 설치/빌드 중 문제가 발생했습니다. 위 메시지를 확인하세요.
pause
exit /b 1
