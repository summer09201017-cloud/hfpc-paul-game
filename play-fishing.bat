@echo off
REM Net for a Catch (Luke 5:1-11) - COLLECT version playtest (Paul repo). English-only, CRLF.
REM Tap the water to cast the net; every fish inside the ring is caught.
REM Phase 1 "toiled all night" = few fish in the shallows. Then Jesus says "put out into the deep" and the deep teems with fish.
REM Not by your own effort - "at your word" God fills the net. "From now on you will catch men" (Lk 5:10-11). Reach the target catch to win.
cd /d "%~dp0"
echo Starting Net for a Catch (Luke 5:1-11) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=fishing
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=fishing"
echo.
echo Server stopped.
pause
