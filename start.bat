@echo off
echo Installing dependencies if needed...
call npm install
echo Starting local development server...
echo The site will automatically open in your default browser.
start http://localhost:5173
call npm run dev
pause
