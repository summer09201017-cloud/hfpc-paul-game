@echo off
REM David harp free-play music toy (Saul soothed) - playtest (Paul repo). English-only, CRLF.
cd /d "%~dp0"
echo Starting "David Harp Free Play" ...
echo If the browser does not open, use the "Local:" URL below and add  /?demo=harptoy
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=harptoy"
echo.
echo Server stopped.
pause