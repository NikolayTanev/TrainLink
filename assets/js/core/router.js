// TrainLink URL Router
import { fixPageLinks } from '../utils/path-helper.js';

// Check if we're in development or production environment
// In development: URLs will have 'pages' in the path or end with .html
// In production: URLs will be clean (e.g., /app instead of /pages/app.html)
const isLocalDevelopment = window.location.href.includes('/pages/') || window.location.href.endsWith('.html');

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Only rewrite links in development mode
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
        // In production, convert file links to clean URLs
        document.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            
            // Skip external links, anchors, or javascript calls
            if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
                return;
            }
            
            // Convert HTML file links to clean URLs
            if (href.includes('.html') || href.includes('/pages/')) {
                let fileName;
                
                // Handle paths like "../pages/app.html" or "/pages/app.html"
                if (href.includes('/pages/')) {
                    fileName = href.split('/pages/').pop();
                } else {
                    fileName = href.split('/').pop();
                }
                
                // Convert to clean URL if mapping exists
                if (routes[fileName]) {
                    a.setAttribute('href', routes[fileName]);
                    console.log(`Rewritten production link from ${href} to ${routes[fileName]}`);
                }
            }
        });
    }

    // Use the path helper to fix links on the page
    fixPageLinks();
}); 