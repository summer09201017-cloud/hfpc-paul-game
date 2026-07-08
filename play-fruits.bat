@echo off
REM fruits playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting fruits ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=fruits
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=fruits"
pause
