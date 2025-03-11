# TrainLink - Workout Tracker

A modern workout tracking application built with vanilla JavaScript, HTML, and CSS on the frontend and Django REST Framework on the backend.

## Features

- Browse suggested workouts with a responsive carousel
- Add custom workouts with YouTube video integration
- Track performance metrics (daily, weekly, monthly)
- View workout history with filtering options
- Mark workouts as favorites
- Expand workouts to view details and watch videos
- Schedule workouts with repeat options
- User authentication and registration
- Responsive design for all screen sizes

## Getting Started

### Running the Backend Server

1. Make sure you have Python installed (Python 3.8+ recommended)
2. Double-click the `start_server.bat` file to start the Django server
   - This will start the server at http://localhost:8000
   - Keep this terminal window open while using the application
   - Press Ctrl+C in the terminal to stop the server when done

### Running the Frontend

1. Open `login.html` in your browser to start using the application
2. Register a new account or login with existing credentials
3. Once logged in, you'll be redirected to the main application

## Troubleshooting

- **"Failed to fetch" errors**: Make sure the Django server is running by checking if the terminal window shows "Starting development server at http://localhost:8000/"
- **Login/Registration issues**: Ensure the server is running and check the terminal for any error messages

## Project Structure

- `index.html` - Main application HTML
- `login.html` - User login page
- `register.html` - User registration page
- `styles.css` - All styles for the application
- `main.js` - Core application functionality
- `api.js` - API client for communicating with the backend
- `add-workout-dialog.js` - Add workout dialog functionality
- `calendar.js` - Calendar and scheduling functionality
- `trainlink_backend/` - Django backend application

## Data Storage

The application now uses a Django backend with SQLite database for data storage, including:
- User accounts
- Workouts
- Scheduled workouts
- Workout logs

## Browser Compatibility

This application is compatible with all modern browsers that support ES6 JavaScript features.

## License

MIT 