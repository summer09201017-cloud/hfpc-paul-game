@echo off
REM fragments playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting fragments ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=fragments
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=fragments"
pause
