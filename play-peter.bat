@echo off
REM Peter following Jesus - Monopoly journey (Gospels + Acts 1-12) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting "Peter follows Jesus" journey ...
echo A browser tab opens automatically at the Peter journey setup.
echo If not, open the "Local:" URL shown below and add  /?journey=peter  then pick the Peter card.
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?journey=peter"
echo.
echo Server stopped.
pause
