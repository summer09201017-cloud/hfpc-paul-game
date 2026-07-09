@echo off
REM basketball playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting basketball ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=basketball
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=basketball"
pause
