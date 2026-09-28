@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js before starting the demo.
  pause
  exit /b 1
)
echo Open http://localhost:8000 in your browser. Press Ctrl+C to stop.
node server.cjs 8000
pause
