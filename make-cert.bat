@echo off
chcp 65001 >nul
REM HTTPS 인증서 만들기 (도커/openssl 불필요) - 더블클릭 실행
REM 먼저 setup-node.bat 을 1회 실행해 두어야 합니다(라이브러리 설치).
cd /d "%~dp0"

echo ============================================
echo  HTTPS 인증서 생성
echo ============================================
set /p IP=서버 IP 를 입력하세요 (예: 10.80.101.200):

if "%IP%"=="" (
  echo IP 를 입력하지 않았습니다. 취소합니다.
  pause
  exit /b 1
)

node "%~dp0server\gen-cert.mjs" %IP%
if errorlevel 1 (
  echo.
  echo [오류] 생성 실패. setup-node.bat 을 먼저 실행했는지 확인하세요.
  pause
  exit /b 1
)

echo.
echo 완료! 이제 start-node.bat 으로 실행하면 https 로 동작합니다.
echo 접속: https://%IP%:5008
pause
