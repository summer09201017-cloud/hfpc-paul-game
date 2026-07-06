@echo off
REM sower playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting sower ...
echo A browser tab opens automatically. If not, open the "Local:" URL below and add  /?demo=sower
if not exist "node_modules" call npm install
call npm run dev -- --open "/?demo=sower"
pause
