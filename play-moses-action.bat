@echo off
REM Moses Lifts His Hands (Exodus 17:8-13) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting Moses Lifts His Hands (Exodus 17:8-13) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=moses-action
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=moses-action"
echo.
echo Server stopped.
pause