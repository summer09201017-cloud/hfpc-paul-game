@echo off
REM Walls of Jericho (Joshua 6) - ANGRY-BIRDS version playtest (Paul repo). English-only, CRLF.
REM Drag back to charge your shout/trumpet, release to blast the wall. March around 7 times (Josh 6:15): each solid shout topples the top layer.
REM The wall falls not by your strength - the LORD makes it collapse (Josh 6:20). Bring down all 7 layers to win.
cd /d "%~dp0"
echo Starting Walls of Jericho (Joshua 6) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=jericho
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=jericho"
echo.
echo Server stopped.
pause
