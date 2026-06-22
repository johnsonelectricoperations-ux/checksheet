@echo off
REM Run without Docker. One Node server serves web + API.
REM Run setup-node.bat once before this.
cd /d "%~dp0server"

set PORT=5008
set DATA_DIR=%~dp0server\data

REM HTTPS: if a cert exists in certs\, it auto-starts as https.
REM (create it with make-cert.bat; without it, runs as http)
set TLS_CERT_FILE=%~dp0certs\server.crt
set TLS_KEY_FILE=%~dp0certs\server.key

echo ============================================
echo  Checksheet server running... (close this window to stop)
echo  The URL is shown in the [server] line below.
echo    with cert : https://(server-ip):5008
echo    no cert   : http://(server-ip):5008
echo  Login: admin / admin123
echo ============================================
node dist/index.js
pause
