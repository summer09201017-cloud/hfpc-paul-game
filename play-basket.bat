@echo off
REM basket playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting basket ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=basket
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=basket"
pause
