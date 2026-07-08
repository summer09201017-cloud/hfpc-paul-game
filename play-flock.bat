@echo off
REM flock playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting flock ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=flock
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=flock"
pause
