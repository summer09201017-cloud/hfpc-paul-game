@echo off
REM lotrun playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting lotrun ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=lotrun
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=lotrun"
pause
