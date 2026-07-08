@echo off
REM gems playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting gems ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=gems
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=gems"
pause
