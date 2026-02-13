@echo off
echo ========================================
echo      SkyVentor V2 Build Script
echo ========================================
echo.

REM Check if wails is installed
where wails >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Wails CLI not found!
    echo Please install it with: go install github.com/wailsapp/wails/v2/cmd/wails@latest
    pause
    exit /b 1
)

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

echo [OK] Prerequisites check passed
echo.

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo [OK] Frontend dependencies installed
echo.

REM Ask user what to do
echo What would you like to do?
echo 1) Run in development mode (wails dev)
echo 2) Build for production (wails build)
echo 3) Exit
echo.
set /p choice="Enter choice [1-3]: "

if "%choice%"=="1" (
    echo.
    echo [INFO] Starting development server...
    wails dev
) else if "%choice%"=="2" (
    echo.
    echo [INFO] Building for production...
    wails build
    echo.
    echo [OK] Build complete! Binary is in .\build\bin\
) else if "%choice%"=="3" (
    echo Goodbye!
    exit /b 0
) else (
    echo [ERROR] Invalid choice
    pause
    exit /b 1
)

pause
