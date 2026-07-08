@echo off
REM glean playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting glean ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=glean
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=glean"
pause
