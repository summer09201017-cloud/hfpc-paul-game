@echo off
REM soccer playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting soccer ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=soccer
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=soccer"
pause
