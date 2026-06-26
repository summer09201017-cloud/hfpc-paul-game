@echo off
REM Nehemiah Rebuilds the Wall - Dodge the Enemy (Nehemiah 4 & 6) - DODGE+BUILD version. English-only, CRLF.
REM Enemies shoot arrows and throw stones to stop the wall. Move the worker Left/Right (or tap screen halves) to dodge.
REM A red warning shows where each shot will land - dodge it. Each dodge raises the wall; finish the wall to win.
REM The worker never strikes back - "our God will fight for us" (Neh 4:20). Reverse-RPG.
cd /d "%~dp0"
echo Starting Nehemiah Rebuilds the Wall (Nehemiah 4 and 6) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=nehemiah
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=nehemiah"
echo.
echo Server stopped.
pause
