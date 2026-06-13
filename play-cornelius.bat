@echo off
REM Reversal Heroes - Gospel Hero (Peter & Cornelius, Acts 10) - CARD level playtest.
REM Starts the Paul dev server and opens ?demo=cornelius. English-only (Chinese breaks .bat).
setlocal enableextensions
title Reversal Heroes - Gospel Hero (Cornelius)
cd /d "%~dp0"

echo ============================================
echo    Gospel Hero - Cornelius (Acts 10)  -  starting...
echo ============================================
echo.

where node >/dev/null 2>&1
if errorlevel 1 (
  echo  Node.js not found. Install it from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  First run - installing packages, about 1-2 minutes, only once...
  call npm install
  if errorlevel 1 (
    echo.
    echo  Install failed. Please screenshot the message above.
    pause
    exit /b 1
  )
)

set /a PORT=5173
set /a TRIES=0
:findport
netstat -ano | findstr "LISTENING" | findstr ":%PORT% " >/dev/null 2>&1
if errorlevel 1 goto gotport
set /a PORT+=1
set /a TRIES+=1
if %TRIES% GEQ 50 (
  echo  No free port found. Close some apps and try again.
  pause
  exit /b 1
)
goto findport
:gotport

set "URL=http://localhost:%PORT%/?demo=cornelius"
echo.
echo  Game URL:  %URL%
echo.
echo  *** Keep THIS window open while playing. Close it to stop the game. ***
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 4; Start-Process '%URL%'"

echo  Starting server (browser opens automatically in a few seconds)...
echo.
call npm run dev -- --port %PORT% --strictPort --host

echo.
echo  Server stopped.
pause
exit /b 0
