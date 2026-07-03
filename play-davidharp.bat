@echo off
REM David plays the harp (Guitar Hero style rhythm) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting "David Plays the Harp" ...
echo A browser tab opens automatically at the game.
echo If not, open the "Local:" URL shown below and add  /?demo=davidharp
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=davidharp"
echo.
echo Server stopped.
pause