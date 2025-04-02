/**
 * TrainLink Path Helper Utility
 * 
 * This utility helps with path resolution for both local development and production.
 * It provides functions to determine proper paths and adjust links accordingly.
 */

// IMPORTANT: Set to false for production deployment
const isLocalDevelopment = false;

/**
 * Calculates a path to a target page based on the environment
 * @param {string} targetFile - The target file (e.g., 'app.html', 'login.html')
 * @returns {string} A proper path to the target
 */
export function getRelativePath(targetFile) {
    // In production, use clean URLs
    if (!isLocalDevelopment) {
        const cleanURLs = {
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
        
        return cleanURLs[targetFile] || `/${targetFile.replace('.html', '')}`;
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
 * Navigates to a target page using appropriate paths based on environment
 * @param {string} targetFile - The target file (e.g., 'app.html', 'login.html')
 */
export function navigateTo(targetFile) {
    window.location.href = getRelativePath(targetFile);
}

/**
 * Fixes all links on the page to use the correct paths based on environment
 */
export function fixPageLinks() {
    // Skip in production mode (the main router will handle it)
    if (!isLocalDevelopment) {
        return;
    }
    
    // Map of clean URLs to their HTML files
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