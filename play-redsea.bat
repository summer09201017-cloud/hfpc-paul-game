@echo off
REM Red Sea Escape (Exodus 14) - ACTION version playtest. English-only, CRLF.
REM Stand and wait for God to part the sea, then run across the seabed.
REM Jump over rocks; jump onto sea creatures (crab/snake/scorpion) to stomp them.
REM Long-press the screen (or hold Right / D) to sprint. Pharaoh's army chases you.
cd /d "%~dp0"
echo Starting Red Sea Escape (Exodus 14) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=redsea
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=redsea"
echo.
echo Server stopped.
pause
