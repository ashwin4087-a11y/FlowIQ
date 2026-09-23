@echo off
REM FlowIQ Emergency Fix Script - Windows

echo.
echo ================================================
echo   FlowIQ EMERGENCY FIX
echo ================================================
echo.

cd /d "c:\Users\USER\Downloads\FlowIQ" || exit /b 1

echo [STEP 1] Killing any running node processes...
taskkill /F /IM node.exe 2>nul

echo [STEP 2] Removing cache and modules...
rmdir /s /q node_modules 2>nul
rmdir /s /q .vite 2>nul
rmdir /s /q dist 2>nul
del pnpm-lock.yaml 2>nul
del package-lock.json 2>nul

echo [STEP 3] Fresh install...
call pnpm install

echo [STEP 4] Starting server...
echo.
echo ================================================
echo   READY! Visit:
echo   http://localhost:5173
echo ================================================
echo.

call pnpm dev
