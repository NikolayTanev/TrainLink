// TrainLink URL Router
import { fixPageLinks } from '../utils/path-helper.js';

document.addEventListener('DOMContentLoaded', function() {
    // Configuration - adjust based on your environment
    // LOCAL DEVELOPMENT MODE: Set to true when using local development
    // PRODUCTION MODE: Set to false when deploying to the actual site
    const isLocalDevelopment = false; // Set to false for production
    
    // Define the base path for your application
    // For production deployments on trainlink.eu
    const basePath = isLocalDevelopment ? '/TrainLink/pages' : '';
    
    // File-to-route mapping (this controls how URLs appear in the browser)
    const routes = {
        'index.html': '/',
        'app.html': '/app',
        'login.html': '/login',
        'register.html': '/register',
        'profile.html': '/profile',
        'privacy-policy.html': '/privacy',
        'terms-of-service.html': '/terms',
        'stats.html': '/stats',
        'devices.html': '/devices',
        '404.html': '/not-found'
    };
    
    // Route-to-file mapping (for incoming clean URLs)
    const routesToFiles = {
        '/': 'index.html',
        '/app': 'app.html',
        '/login': 'login.html',
        '/register': 'register.html',
        '/profile': 'profile.html',
        '/privacy': 'privacy-policy.html',
        '/terms': 'terms-of-service.html',
        '/stats': 'stats.html',
        '/devices': 'devices.html',
        '/not-found': '404.html'
    };
    
    // Get current path from location
    const path = window.location.pathname;
    const currentPage = path.split('/').pop();
    
    console.log("Current path:", path);
    console.log("Current page:", currentPage);
    
    // Only rewrite links in local development mode
    if (isLocalDevelopment) {
        // Fix any links on the page to use the correct paths for local development
        document.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            
            // Skip external links, anchors, or javascript calls
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }
            
            // Handle clean URL formats like "/app" or "/stats"
            if (href.startsWith('/') && !href.includes('.html')) {
                const route = href;
                const targetFile = routesToFiles[route];
                
                if (targetFile) {
                    // For local development with Live Server, we need relative paths to actual HTML files
                    let relativePath = '../pages/' + targetFile;
                    a.setAttribute('href', relativePath);
                    console.log(`Rewritten link from ${href} to ${relativePath}`);
                }
            }
        });
    } else {
        // In production, fix any HTML links to use clean URLs
        document.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            
            // Skip external links, anchors, or javascript calls
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }
            
            // Convert HTML file links to clean URLs
            if (href.includes('.html')) {
                // Extract the file name
                const fileName = href.split('/').pop();
                
                // Check if we have a route mapping for this file
                if (routes[fileName]) {
                    const cleanURL = routes[fileName];
                    a.setAttribute('href', cleanURL);
                    console.log(`Rewritten link from ${href} to ${cleanURL}`);
                }
            }
        });
    }

    // Use the path helper to fix links on the page
    fixPageLinks();
}); 