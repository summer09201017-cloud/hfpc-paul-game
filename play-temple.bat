@echo off
REM temple playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting temple ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=temple
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=temple"
pause
