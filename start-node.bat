@echo off
REM 도커 없이 Node.js 로 실행 (서버 하나가 웹+API 모두 제공)
REM 먼저 setup-node.bat 을 1회 실행해 두어야 합니다.
cd /d "%~dp0\server"

REM 데이터는 server\data 폴더에 저장됩니다.
set PORT=5008
set DATA_DIR=%~dp0server\data

REM HTTPS 로 쓰려면 아래 두 줄의 REM 을 지우고 인증서 경로를 맞추세요(오프라인 기능용).
REM set TLS_CERT_FILE=%~dp0certs\server.crt
REM set TLS_KEY_FILE=%~dp0certs\server.key

echo ============================================
echo  점검시트 시스템 실행 중... (이 창을 닫으면 종료됩니다)
echo  접속: http://localhost:5008
echo        http://10.80.101.200:5008  (태블릿/다른 PC)
echo  로그인: admin / admin123
echo ============================================
node dist/index.js
pause
