@echo off
REM armor playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting armor ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=armor
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=armor"
pause
