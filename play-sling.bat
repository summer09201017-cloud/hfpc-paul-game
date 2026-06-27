@echo off
REM David's Sling (1 Samuel 17) - SLINGSHOT/AIM version playtest (Paul repo). English-only, CRLF.
REM Drag the sling back to set angle and power, release to fling the stone at Goliath's forehead. A dotted arc previews the shot.
REM Not by sword or spear - the battle is the LORD's (1 Sam 17:47). Hit the forehead to win.
cd /d "%~dp0"
echo Starting David's Sling (1 Samuel 17) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=sling
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=sling"
echo.
echo Server stopped.
pause
