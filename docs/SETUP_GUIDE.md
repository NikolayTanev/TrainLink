# TrainLink Setup Guide

This guide will help you set up and run the TrainLink application correctly.

## Prerequisites

- Python 3.8 or higher
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Step 1: Start the Django Backend Server

1. Open a command prompt or terminal
2. Navigate to the TrainLink project directory
3. Run the `start_server.bat` file by double-clicking it or running it from the command line
4. You should see output indicating that the server is running at http://127.0.0.1:8000
5. **Keep this terminal window open** while using the application

## Step 2: Access the Frontend

There are two ways to access the frontend:

### Option 1: Using the start_app.bat file
1. Double-click the `start_app.bat` file to open the login page in your default browser

### Option 2: Using VS Code Live Server or another development server
1. If you're using VS Code with Live Server extension, right-click on `login.html` and select "Open with Live Server"
2. This will typically open the application at http://127.0.0.1:5500/login.html

## Step 3: Register a New Account

1. On the login page, click "Sign Up" to navigate to the registration page
2. Fill in all required fields:
   - Username
   - Email
   - First Name
   - Last Name
   - Password (and confirm password)
3. Click "Sign Up" to create your account
4. If successful, you'll be redirected to the main application

## Step 4: Log In

1. Enter your username and password
2. Click "Sign In"
3. If successful, you'll be redirected to the main application

## Troubleshooting

### "Failed to fetch" Error
- Make sure the Django server is running (check the terminal window from Step 1)
- Verify that the server is running on port 8000
- Check that the API_BASE_URL in `api.js` is set to `http://127.0.0.1:8000/api`

### "Failed to execute 'json' on 'Response'" Error
- This usually indicates that the server is responding but not with valid JSON
- Check the browser's developer console (F12) for more detailed error messages
- Make sure the Django server has the correct CORS settings (already fixed in the latest update)

### Server Not Starting
- Make sure Python is installed and in your PATH
- Check if Django and other required packages are installed
- Look for error messages in the terminal window

### Other Issues
- Clear your browser cache and cookies
- Try using a different browser
- Check the browser's developer console (F12) for error messages

## Testing the Server Connection

You can test if the Django server is properly responding to API requests by running the `test_server.bat` file. This will show you if the server is running and if the API endpoints are accessible.

## Need More Help?

If you continue to experience issues, please provide:
1. Screenshots of any error messages
2. The output from the Django server terminal
3. Any error messages from the browser's developer console (F12) 