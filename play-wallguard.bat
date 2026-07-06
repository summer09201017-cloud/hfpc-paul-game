@echo off
REM wallguard playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting wallguard ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=wallguard
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=wallguard"
pause
