@echo off
REM 도커 없이 Node.js 로 실행 (서버 하나가 웹+API 모두 제공)
REM 먼저 setup-node.bat 을 1회 실행해 두어야 합니다.
cd /d "%~dp0\server"

REM 데이터는 server\data 폴더에 저장됩니다.
set PORT=5008
set DATA_DIR=%~dp0server\data

REM HTTPS: certs\ 폴더에 인증서가 있으면 자동으로 https 로 동작합니다.
REM (make-cert.bat 으로 생성. 인증서가 없으면 그냥 http 로 동작)
set TLS_CERT_FILE=%~dp0certs\server.crt
set TLS_KEY_FILE=%~dp0certs\server.key

echo ============================================
echo  점검시트 시스템 실행 중... (이 창을 닫으면 종료됩니다)
echo  접속 주소는 아래 [server] 줄에 표시됩니다.
echo   - 인증서 있으면: https://(서버IP):5008
echo   - 인증서 없으면: http://(서버IP):5008
echo  로그인: admin / admin123
echo ============================================
node dist/index.js
pause
