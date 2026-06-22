@echo off
REM Create HTTPS certificate (no Docker / no openssl needed).
REM Run setup-node.bat once before this.
cd /d "%~dp0"

set /p IP=Enter server IP (e.g. 10.80.101.200):

if "%IP%"=="" (
  echo No IP entered. Cancelled.
  pause
  exit /b 1
)

node "%~dp0server\gen-cert.mjs" %IP%
if errorlevel 1 (
  echo.
  echo [ERROR] Failed. Did you run setup-node.bat first?
  pause
  exit /b 1
)

echo.
echo Done! Now run start-node.bat (it will use HTTPS).
echo URL: https://%IP%:5008
pause
