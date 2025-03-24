@echo off
echo Testing Django server connection...
curl -v http://127.0.0.1:8000/api/users/register/
echo.
echo If you see HTML output or a 404 error, the server is running but the API endpoint may be incorrect.
echo If you see "Failed to connect", the server is not running.
pause 