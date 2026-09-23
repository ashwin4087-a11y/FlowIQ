@echo off
REM FlowIQ Localhost Starter - Windows

echo.
echo ========================================
echo   FlowIQ - Localhost Starter
echo ========================================
echo.

cd "c:\Users\USER\Downloads\FlowIQ"

if not exist "node_modules" (
  echo [1/2] Installing dependencies...
  echo.
  pnpm install
  echo.
)

echo [2/2] Starting development server...
echo.
echo ========================================
echo   FlowIQ is LIVE!
echo ========================================
echo.
echo   Main App:  http://localhost:5173
echo   Routes:    http://localhost:5173/flowiq-enhanced-routes.html
echo   Diagnostic: http://localhost:5173/DIAGNOSTIC.html
echo.
echo   Press Ctrl+C to stop
echo ========================================
echo.

pnpm dev

pause
