@echo off
REM steward playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting steward ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=steward
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=steward"
pause
