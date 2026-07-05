@echo off
REM The Good Shepherd - Find the Lost Sheep (Luke 15:3-7) - maze playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting The Good Shepherd maze ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=shepherd
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=shepherd"
echo.
echo Server stopped.
pause