@echo off
REM goalkick playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting goalkick ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=goalkick
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=goalkick"
pause
