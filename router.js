// TrainLink URL Router
document.addEventListener('DOMContentLoaded', function() {
    // File-to-route mapping (this controls how URLs appear in the browser)
    const routes = {
        'index.html': '/',
        'app.html': '/app',
        'privacy-policy.html': '/privacy',
        'terms-of-service.html': '/terms',
        'stats.html': '/stats'
    };
    
    // Route-to-file mapping (for incoming clean URLs)
    const routesToFiles = {
        '/': 'index.html',
        '/app': 'app.html',
        '/privacy': 'privacy-policy.html',
        '/terms': 'terms-of-service.html',
        '/stats': 'stats.html'
    };
    
    // Get current page URL
    const path = window.location.pathname;
    const currentPage = path.split('/').pop();
    
    // Handle redirects for clean URLs
    // This will convert incoming /app to app.html, etc.
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (routesToFiles[cleanPath] && !path.includes('.html')) {
        window.location.href = routesToFiles[cleanPath];
        return;
    }
    
    // Rewrite URLs to look clean in the address bar
    if (currentPage && routes[currentPage]) {
        const newPath = window.location.pathname.replace(currentPage, routes[currentPage].substring(1));
        history.replaceState({}, document.title, newPath);
    }
    
    // No need to modify the actual link href attributes
    // The browser will still navigate to the correct .html files,
    // but the URL displayed will be the clean version
}); 