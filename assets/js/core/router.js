// TrainLink URL Router
import { fixPageLinks } from '../utils/path-helper.js';

document.addEventListener('DOMContentLoaded', function() {
    // Configuration - adjust based on your development environment
    const isLocalDevelopment = true; // Set to true when using Live Server
    const basePath = isLocalDevelopment ? '/TrainLink/pages' : '';
    
    // File-to-route mapping (this controls how URLs appear in the browser)
    const routes = {
        'index.html': '/',
        'app.html': '/app',
        'privacy-policy.html': '/privacy',
        'terms-of-service.html': '/terms',
        'stats.html': '/stats',
        'devices.html': '/devices'
    };
    
    // Route-to-file mapping (for incoming clean URLs)
    const routesToFiles = {
        '/': 'index.html',
        '/app': 'app.html',
        '/privacy': 'privacy-policy.html',
        '/terms': 'terms-of-service.html',
        '/stats': 'stats.html',
        '/devices': 'devices.html'
    };
    
    // Get current path from location
    const path = window.location.pathname;
    const currentPage = path.split('/').pop();
    
    console.log("Current path:", path);
    console.log("Current page:", currentPage);
    
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
                if (isLocalDevelopment) {
                    let relativePath = '../pages/' + targetFile;
                    a.setAttribute('href', relativePath);
                    console.log(`Rewritten link from ${href} to ${relativePath}`);
                }
            }
        }
    });

    // Use the path helper to fix links on the page
    fixPageLinks();
}); 