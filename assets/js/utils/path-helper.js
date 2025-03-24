/**
 * TrainLink Path Helper Utility
 * 
 * This utility helps with path resolution for local development with Live Server.
 * It provides functions to determine relative paths and adjust links accordingly.
 */

/**
 * Calculates a relative path to a target in the 'pages' directory based on the current location
 * @param {string} targetFile - The target file (e.g., 'app.html', 'login.html')
 * @returns {string} A relative path to the target
 */
export function getRelativePath(targetFile) {
    const isLocalDevelopment = true; // Set to true for Live Server
    
    if (!isLocalDevelopment) {
        // In production, use clean URLs
        const cleanURLs = {
            'index.html': '/',
            'app.html': '/app',
            'privacy-policy.html': '/privacy',
            'terms-of-service.html': '/terms',
            'stats.html': '/stats',
            'devices.html': '/devices',
            'login.html': '/login',
            'register.html': '/register'
        };
        
        return cleanURLs[targetFile] || `/${targetFile}`;
    }
    
    // For local development, we need to calculate relative paths
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    
    // Check if we're already in the pages directory
    const inPagesDir = pathSegments.includes('pages');
    
    if (inPagesDir) {
        // If we're already in the pages directory, use a simple relative path
        return targetFile;
    } else {
        // If we're not in the pages directory, we need to navigate to it
        // Calculate how many levels deep we are
        const depth = pathSegments.length - 1; // -1 because the first segment is empty
        const prefix = depth > 1 ? '../'.repeat(depth - 1) : './';
        
        return `${prefix}pages/${targetFile}`;
    }
}

/**
 * Navigates to a target page using relative paths
 * @param {string} targetFile - The target file (e.g., 'app.html', 'login.html')
 */
export function navigateTo(targetFile) {
    window.location.href = getRelativePath(targetFile);
}

/**
 * Fixes all links on the page to use the correct relative paths for local development
 */
export function fixPageLinks() {
    const isLocalDevelopment = true; // Set to true for Live Server
    
    if (!isLocalDevelopment) {
        return; // Don't do anything in production mode
    }
    
    // Map of clean URLs to their HTML files
    const routesToFiles = {
        '/': 'index.html',
        '/app': 'app.html',
        '/privacy': 'privacy-policy.html',
        '/terms': 'terms-of-service.html',
        '/stats': 'stats.html',
        '/devices': 'devices.html',
        '/login': 'login.html',
        '/register': 'register.html'
    };
    
    // Fix links on the page
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
                // Get the proper relative path
                const relativePath = getRelativePath(targetFile);
                
                a.setAttribute('href', relativePath);
                console.log(`Fixed link from ${href} to ${relativePath}`);
            }
        }
    });
}

// Automatically fix links when the DOM is loaded
document.addEventListener('DOMContentLoaded', fixPageLinks); 