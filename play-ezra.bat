@echo off
REM ezra playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting ezra ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=ezra
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=ezra"
pause
