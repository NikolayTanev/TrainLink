# TrainLink - Workout Tracking & Scheduling App

TrainLink helps you track, schedule, and achieve your fitness goals with smart workout planning, progress tracking, and workout management all in one place.

## Routing Configuration

TrainLink supports two routing modes: development and production.

### Development Mode (Default)

This mode uses file paths with .html extensions for better compatibility with local development servers.

To enable development mode:

1. In `assets/js/core/router.js`: Set `isLocalDevelopment = true`
2. In `assets/js/utils/path-helper.js`: Set `isLocalDevelopment = true`
3. In `.htaccess`: Comment out all the rewrite rules (already done by default)
4. In `netlify.toml`: Comment out all the redirect rules (already done by default)

### Production Mode

This mode uses clean URLs without .html extensions (e.g., `/app` instead of `/app.html`).

To enable production mode:

1. In `assets/js/core/router.js`: Set `isLocalDevelopment = false`
2. In `assets/js/utils/path-helper.js`: Set `isLocalDevelopment = false`
3. In `.htaccess`: Uncomment the rewrite rules
4. In `netlify.toml`: Uncomment the redirect rules

## Troubleshooting

If you encounter a redirection loop:
- Make sure all files are consistently set to either development or production mode
- Check server configuration to ensure it's not adding additional redirects

## Server Configuration

The repository includes configuration files for various hosting environments:

- `.htaccess` for Apache servers
- `netlify.toml` for Netlify hosting

## Development

1. Clone the repository
2. Ensure files are in development mode
3. Use a local server like Live Server to test

## Deployment

1. Switch to production mode
2. Deploy to your web hosting
3. Ensure the server supports URL rewriting

## License

See the LICENSE file for details. 