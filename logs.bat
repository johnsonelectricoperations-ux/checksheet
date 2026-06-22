@echo off
REM Show logs (Docker). Close window to exit.
cd /d "%~dp0"
docker compose -f docker-compose.http.yml logs -f
