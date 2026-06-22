@echo off
chcp 65001 >nul
REM [1회 실행] 도커 없이 Node.js 로 준비 - 라이브러리 설치 + 빌드
REM 인터넷 연결 상태에서 실행하세요. Node.js 22 가 설치되어 있어야 합니다.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [오류] Node.js 가 없습니다. https://nodejs.org 에서 "22 LTS" 설치 후 다시 실행하세요.
  pause
  exit /b 1
)

REM Node 버전 확인: 22 LTS 권장 (23 이상은 better-sqlite3 미리빌드가 없어 컴파일 필요)
for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODEMAJOR=%%v
if %NODEMAJOR% GEQ 23 (
  echo ============================================
  echo  [경고] 현재 Node 버전이 너무 최신입니다 (v%NODEMAJOR%).
  echo  이 버전은 데이터베이스 라이브러리 설치 시 컴파일 도구가 필요해 실패할 수 있습니다.
  echo  https://nodejs.org 에서 "22 LTS" 를 설치하시길 권장합니다.
  echo ============================================
  choice /m "그래도 계속 진행할까요"
  if errorlevel 2 exit /b 1
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
