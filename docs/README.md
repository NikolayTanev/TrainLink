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

Simply open `index.html` in your web browser to start using the application.

### Running the Frontend

1. Clone this repository
2. Open `index.html` in your browser
3. Make changes to the code as needed

## Troubleshooting

- **Workout videos not playing**: Check your internet connection as videos are loaded from external sources
- **Calendar not showing**: Make sure JavaScript is enabled in your browser

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `main.js` - Core application logic
- `add-workout-dialog.js` - Workout creation dialog functionality
- `calendar.js` - Calendar view functionality
- `mobile-enhancements.js` - Mobile-specific enhancements
- `cookie-consent.js` - Cookie consent functionality
- `privacy-policy.html` - Privacy policy page
- `terms-of-service.html` - Terms of service page

## Data Storage

The application uses browser localStorage to store:
- Workout definitions
- Scheduled workouts
- Workout logs
- User preferences

This means all data is stored locally on the user's device and is not sent to any server.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 