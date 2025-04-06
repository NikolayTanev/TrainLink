# TrainLink Project Structure

This document outlines the organization of the TrainLink project, providing an overview of directories and their purposes.

## Directory Structure

```
TrainLink/
├── assets/                 # Static resources
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript files
│   │   ├── core/           # Core functionality
│   │   ├── features/       # Feature-specific logic
│   │   └── utils/          # Utility functions
│   └── images/             # Images and icons
├── pages/                  # HTML pages
├── components/             # Reusable UI components (future use)
└── docs/                   # Documentation
```

## Key Files

### Core JavaScript Files

- `assets/js/core/api.js` - API communication and data handling
- `assets/js/core/router.js` - Client-side routing
- `assets/js/core/main.js` - Main application initialization and logic

### Feature JavaScript Files

- `assets/js/features/calendar.js` - Calendar and scheduling functionality
- `assets/js/features/stats.js` - Statistics and progress tracking
- `assets/js/features/devices.js` - Integration with fitness devices
- `assets/js/features/add-workout-dialog.js` - Workout creation UI and logic

### Utility JavaScript Files

- `assets/js/utils/cookie-consent.js` - Cookie consent management
- `assets/js/utils/mobile-enhancements.js` - Mobile-specific improvements

### HTML Pages

- `pages/index.html` - Main entry page
- `pages/login.html` - User login
- `pages/register.html` - User registration
- `pages/stats.html` - Statistics dashboard
- `pages/devices.html` - Device management
- `pages/app.html` - Main application interface
- `pages/terms-of-service.html` - Legal terms of service
- `pages/privacy-policy.html` - Privacy policy
- `pages/404.html` - Error page

### CSS Files

- `assets/css/styles.css` - Main application styles
- `assets/css/landing-styles.css` - Landing page specific styles

## Development Workflow

1. Work on HTML pages in the `pages/` directory
2. Keep all styles in the `assets/css/` directory
3. Organize JavaScript by function:
   - Core application logic in `assets/js/core/`
   - Feature-specific code in `assets/js/features/`
   - Utility/helper functions in `assets/js/utils/`
4. Place all images and visual assets in `assets/images/`
5. Use the `components/` directory for future reusable UI components

## Best Practices

1. Maintain separation of concerns (HTML/CSS/JS)
2. Group related functionality together
3. Follow consistent naming conventions:
   - Feature files should be named for their primary function
   - Use kebab-case for filenames
4. Keep documentation up-to-date in the `docs/` directory 