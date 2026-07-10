@echo off
REM billiards playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting billiards ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=billiards
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=billiards"
pause
