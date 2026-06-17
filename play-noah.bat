@echo off
REM Noah's Ark - Monopoly journey (Genesis 6-9) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting Noah's Ark journey ...
echo A browser tab opens automatically at the Noah journey setup.
echo If not, open the "Local:" URL shown below and add  /?journey=noah  then pick the Noah card.
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?journey=noah"
echo.
echo Server stopped.
pause
