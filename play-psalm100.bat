@echo off
REM Psalm 100 praise piano (4K falling rhythm) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting "Psalm 100 Praise Piano" ...
echo A browser tab opens automatically at the game.
echo If not, open the "Local:" URL shown below and add  /?demo=psalm100
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=psalm100"
echo.
echo Server stopped.
pause