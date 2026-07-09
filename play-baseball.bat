@echo off
REM baseball playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting baseball ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=baseball
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=baseball"
pause
