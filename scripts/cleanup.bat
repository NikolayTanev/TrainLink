@echo off
echo Cleaning up TrainLink project...

echo.
echo Removing backend-related files and directories...
rmdir /s /q trainlink_backend
rmdir /s /q supabase
del api.js
del login.html
del register.html
del setup_backend.bat
del start_server.bat
del test_server.bat

echo.
echo Removing development and setup files...
rmdir /s /q .vscode
del SETUP_GUIDE.md
del DEVELOPER_NOTES.md
del start_app.bat
del to-do.txt

echo.
echo Cleanup complete!
echo The following essential files have been kept:
echo - index.html
echo - main.js
echo - styles.css
echo - add-workout-dialog.js
echo - calendar.js
echo - mobile-enhancements.js
echo - cookie-consent.js
echo - privacy-policy.html
echo - terms-of-service.html
echo - README.md
echo - CNAME
echo - ads.txt

echo.
echo Note: This script does not remove the .git directory.
echo If you want to remove Git history, manually delete the .git directory.

pause 