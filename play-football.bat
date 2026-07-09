@echo off
REM football playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting football ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=football
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=football"
pause
