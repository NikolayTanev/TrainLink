@echo off
echo Installing TrainLink backend dependencies...

cd trainlink_backend

echo Installing Python packages...
python -m pip install -r requirements.txt

echo Creating database...
python manage.py makemigrations
python manage.py migrate

echo.
echo Setup complete! You can now run start_server.bat to start the application.
pause 