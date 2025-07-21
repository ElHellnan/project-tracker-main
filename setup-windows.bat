@echo off
echo Setting up Project Tracker for Windows...
echo.

REM Create Windows directory
if not exist "C:\project-tracker-main" mkdir "C:\project-tracker-main"

REM Copy files from WSL to Windows
echo Copying project files...
xcopy "%~dp0*" "C:\project-tracker-main\" /E /I /Y

echo.
echo Project copied to C:\project-tracker-main
echo.
echo Next steps:
echo 1. Make sure Node.js is installed on Windows
echo 2. Run: C:\project-tracker-main\start-backend.bat
echo 3. Run: C:\project-tracker-main\start-frontend.bat
echo.
pause