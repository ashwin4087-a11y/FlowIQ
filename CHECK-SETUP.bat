@echo off
REM Check if FlowIQ can run

echo.
echo Checking FlowIQ Setup...
echo.

cd /d "c:\Users\USER\Downloads\FlowIQ"

REM Check Node
echo [CHECK 1] Node.js installed?
node --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Node.js NOT found! Download from https://nodejs.org
  exit /b 1
) else (
  echo ✅ Node.js: 
  node --version
)

echo.

REM Check pnpm
echo [CHECK 2] pnpm installed?
pnpm --version >nul 2>&1
if errorlevel 1 (
  echo ❌ pnpm NOT found!
  echo Installing: npm install -g pnpm
  call npm install -g pnpm
) else (
  echo ✅ pnpm: 
  pnpm --version
)

echo.

REM Check project files
echo [CHECK 3] Project files?
if exist "package.json" (
  echo ✅ package.json found
) else (
  echo ❌ package.json NOT found!
  exit /b 1
)

if exist "index.html" (
  echo ✅ index.html found
) else (
  echo ❌ index.html NOT found!
  exit /b 1
)

if exist "src/main.tsx" (
  echo ✅ src/main.tsx found
) else (
  echo ❌ src/main.tsx NOT found!
  exit /b 1
)

echo.
echo [CHECK 4] Dependencies installed?
if exist "node_modules" (
  echo ✅ node_modules found
) else (
  echo ⚠️  node_modules NOT found - installing...
  call pnpm install
)

echo.
echo ================================================
echo   ALL CHECKS PASSED!
echo   
echo   Ready to start? Run:
echo   pnpm dev
echo   
echo   Or double-click:
echo   START-LOCALHOST.bat
echo ================================================
echo.

pause
