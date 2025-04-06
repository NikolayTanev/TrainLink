@echo off
echo Starting TrainLink Django Server...

cd trainlink_backend

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Django is installed
python -c "import django" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Django is not installed. Running setup...
    cd ..
    call setup_backend.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Setup failed. Please check the error messages above.
        pause
        exit /b 1
    )
    cd trainlink_backend
)

echo Starting server at http://127.0.0.1:8000
echo.
echo IMPORTANT: Keep this window open while using the application
echo Press Ctrl+C to stop the server when done
echo.

python manage.py runserver

pause 