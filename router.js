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
    console.log("Current path:", path);
    
    // Handle root path specially
    if (path === '/' || path === '') {
        // Already at the root, no need to redirect
        return;
    }
    
    // Check if we're at the exact clean URL that matches a route
    // For example, if we're at /stats or /app
    const exactMatch = routesToFiles[path];
    if (exactMatch) {
        if (!window.location.href.endsWith(exactMatch)) {
            console.log(`Redirecting from ${path} to ${exactMatch}`);
            window.location.href = exactMatch;
            return;
        }
    }
    
    // Handle paths with trailing slash
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (routesToFiles[cleanPath] && !path.includes('.html')) {
        console.log(`Redirecting from ${cleanPath} to ${routesToFiles[cleanPath]}`);
        window.location.href = routesToFiles[cleanPath];
        return;
    }
    
    // Get the current page from the path
    const currentPage = path.split('/').pop();
    
    // Rewrite URLs to look clean in the address bar
    if (currentPage && routes[currentPage]) {
        const newPath = window.location.pathname.replace(currentPage, routes[currentPage].substring(1));
        console.log(`Rewriting URL from ${window.location.pathname} to ${newPath}`);
        history.replaceState({}, document.title, newPath);
    }
    
    // Fix any links on the page to use clean URLs
    document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.endsWith('.html')) {
            // Remove .html from the end of links
            for (const [htmlFile, cleanRoute] of Object.entries(routes)) {
                if (href === htmlFile) {
                    a.setAttribute('href', cleanRoute);
                    break;
                }
            }
        }
    });
}); 