@echo off
REM Saul's Spear - David Dodges (1 Samuel 18-19) - DODGE version playtest (Paul repo). English-only, CRLF.
REM Saul throws spears while David plays the harp; move David with Left/Right (or tap screen halves) to dodge.
REM A red warning marks where each spear will fall - dodge it. Survive all the spears to win.
REM David never strikes back - he trusts God (1 Sam 24:6; 26:11). Reverse-RPG.
cd /d "%~dp0"
echo Starting Saul's Spear - David Dodges (1 Samuel 18-19) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=saul-spear
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=saul-spear"
echo.
echo Server stopped.
pause
