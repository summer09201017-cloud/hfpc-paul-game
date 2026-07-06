@echo off
REM foxes playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting foxes ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=foxes
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=foxes"
pause
