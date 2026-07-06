@echo off
REM Joseph Coat of Many Colors (Genesis 37-50) - sliding puzzle playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting Joseph Coat puzzle ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=joseph
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=joseph"
echo.
echo Server stopped.
pause
