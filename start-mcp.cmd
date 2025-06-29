@echo off
REM Web3 Data MCP Server Startup Script for Windows
REM This script handles common environment configuration issues

setlocal enabledelayedexpansion

echo.
echo =============================================
echo 🚀 Web3 Data MCP Server Startup Script
echo =============================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0

REM Check Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js is not installed
    echo Please install Node.js 16+ from https://nodejs.org
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=v." %%a in ('node -v') do (
    set NODE_MAJOR=%%b
)

if !NODE_MAJOR! LSS 16 (
    echo ❌ Error: Node.js version must be 16 or higher
    node -v
    exit /b 1
)

echo ✓ Node.js version: 
node -v

REM Check if we're in the correct directory
if not exist "%SCRIPT_DIR%package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the web3-data-mcp directory
    exit /b 1
)

REM Check if dependencies are installed
if not exist "%SCRIPT_DIR%node_modules" (
    echo ⚠️  Dependencies not installed. Installing now...
    cd /d "%SCRIPT_DIR%"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error: Failed to install dependencies
        exit /b 1
    )
)

REM Check for API key
if "%ROOTDATA_API_KEY%"=="" (
    REM Try to load from .env file
    if exist "%SCRIPT_DIR%.env" (
        echo Loading environment from .env file...
        for /f "usebackq tokens=1,2 delims==" %%a in ("%SCRIPT_DIR%.env") do (
            if not "%%a"=="" if not "%%b"=="" (
                set "%%a=%%b"
            )
        )
    )
    
    REM Check again after loading .env
    if "!ROOTDATA_API_KEY!"=="" (
        echo ❌ Error: ROOTDATA_API_KEY not set
        echo.
        echo Please set your RootData API key using one of these methods:
        echo.
        echo 1. Set environment variable:
        echo    set ROOTDATA_API_KEY=your-api-key
        echo.
        echo 2. Create a .env file:
        echo    echo ROOTDATA_API_KEY=your-api-key > %SCRIPT_DIR%.env
        echo.
        echo 3. Pass as environment variable:
        echo    set ROOTDATA_API_KEY=your-api-key ^&^& %0
        echo.
        echo Get your API key from: https://rootdata.com
        exit /b 1
    )
)

echo ✓ RootData API key configured

REM Enable debug mode if requested
if "%1"=="--debug" set DEBUG=true
if "%DEBUG%"=="true" set MCP_DEBUG=true
if "%MCP_DEBUG%"=="true" (
    set DEBUG=true
    echo 🔍 Debug mode enabled
)

REM Start the server
echo.
echo Starting Web3 Data MCP Server...
echo ==================================

cd /d "%SCRIPT_DIR%"
node src\index.js %*