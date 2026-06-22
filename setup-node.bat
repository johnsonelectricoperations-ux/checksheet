@echo off
REM One-time setup: install libraries and build. Needs internet + Node 22 LTS.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install "22 LTS" from https://nodejs.org and retry.
  pause
  exit /b 1
)

echo Current Node version:
node -v
echo (Should be v22. If v24, please install 22 LTS instead.)
echo.

echo [1/2] Server: install + build
cd /d "%~dp0server"
call npm install
if errorlevel 1 goto err
call npm run build
if errorlevel 1 goto err

echo [2/2] Web: install + build
cd /d "%~dp0web"
call npm install
if errorlevel 1 goto err
call npm run build
if errorlevel 1 goto err

echo.
echo ===== DONE!  Now run start-node.bat to launch. =====
pause
exit /b 0

:err
echo.
echo [ERROR] Install/build failed. See messages above.
pause
exit /b 1
