@echo off
REM Samuel Hears the Call (1 Samuel 3) - memory sequence playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting Samuel Hears the Call ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=samuel
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=samuel"
echo.
echo Server stopped.
pause
