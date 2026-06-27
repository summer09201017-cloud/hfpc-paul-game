@echo off
REM Restoration by the Shore (John 21:15-19) - playtest (Paul repo). English-only, CRLF.
REM Jesus asks Peter three times "Do you love me?" - tap to answer, then feed His sheep one by one (tap each sheep).
REM Peter denied 3 times by a charcoal fire; the risen Lord restores him 3 times by a charcoal fire. "Follow me" (Jn 21:19). No martyrdom shown.
cd /d "%~dp0"
echo Starting Restoration by the Shore (John 21:15-19) ...
echo A browser tab opens automatically. If not, open the "Local:" URL shown below and add  /?demo=shore
echo Keep THIS window open while playing. Close it to stop.
echo.
if not exist "node_modules" (
  echo First run: installing packages, about 1-2 minutes, only once...
  call npm install
)
call npm run dev -- --open "/?demo=shore"
echo.
echo Server stopped.
pause
