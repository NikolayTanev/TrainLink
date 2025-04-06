# TrainLink - Workout Tracking & Scheduling App

TrainLink helps you track, schedule, and achieve your fitness goals with smart workout planning, progress tracking, and workout management all in one place.

## Routing Configuration

TrainLink supports two routing modes that are now automatically detected:

### Development Mode

In development mode, the app uses file paths with .html extensions for better compatibility with local development servers. This mode is automatically detected when URLs contain '/pages/' or end with '.html'.

### Production Mode

In production mode, the app uses clean URLs without .html extensions (e.g., `/app` instead of `/app.html`). This mode is automatically detected when accessing the site through clean URLs.

## Server Configuration Files

The repository includes configuration files for various hosting environments:

- `.htaccess` for Apache servers - Already configured for production
- `netlify.toml` for Netlify hosting - Already configured for production

## Development

1. Clone the repository
2. Use a local server like Live Server to test (URLs will have '/pages/' in them)
3. The app will automatically detect development mode and adjust paths accordingly

## Deployment

1. Deploy to your web hosting
2. The app will automatically detect production mode and use clean URLs
3. Make sure your server supports URL rewriting

## Troubleshooting

### Script Loading Errors

If you see "Cannot use import statement outside a module" errors, make sure all script tags include `type="module"`:

```html
<script type="module" src="../assets/js/core/router.js"></script>
```

### Redirection Loops

If you encounter redirection loops:
- Clear your browser cache
- Check server configuration to ensure your server supports URL rewriting
- Verify that the .htaccess or netlify.toml file is properly deployed

## License

See the LICENSE file for details. 