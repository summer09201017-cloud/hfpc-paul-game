@echo off
REM arkmatch playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting arkmatch ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=arkmatch
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=arkmatch"
pause
