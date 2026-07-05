@echo off
REM Balaam's Donkey - Action (Numbers 22) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting Balaam's Donkey - Action (Numbers 22) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=balaam-action
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=balaam-action"
echo.
echo Server stopped.
pause