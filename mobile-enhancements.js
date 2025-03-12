/**
 * Mobile Enhancements for TrainLink
 * Improves the user experience on mobile devices
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Apply mobile-specific enhancements
        enhanceMobileExperience();
    }
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            adjustForOrientation();
        }, 300); // Small delay to ensure the orientation change is complete
    });
    
    // Listen for resize events (for testing in dev tools)
    window.addEventListener('resize', function() {
        if ((window.innerWidth <= 768 && !isMobile) || 
            (window.innerWidth > 768 && isMobile)) {
            // Reload the page if crossing the mobile threshold
            window.location.reload();
        }
    });
    
    /**
     * Apply mobile-specific enhancements
     */
    function enhanceMobileExperience() {
        // Improve touch targets
        improveTouchTargets();
        
        // Optimize scrolling
        optimizeScrolling();
        
        // Adjust dialogs for mobile
        adjustDialogsForMobile();
        
        // Enhance workout cards for mobile
        enhanceWorkoutCards();
    }
    
    /**
     * Improve touch targets for mobile users
     */
    function improveTouchTargets() {
        // Make buttons more tappable
        document.querySelectorAll('button, .workout-actions > *').forEach(function(button) {
            if (!button.classList.contains('carousel-arrow')) {
                button.style.minHeight = '44px';
            }
        });
        
        // Add active state for touch feedback
        document.querySelectorAll('button, .workout-card, .upcoming-workout-card, a').forEach(function(element) {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            });
        });
    }
    
    /**
     * Optimize scrolling for mobile
     */
    function optimizeScrolling() {
        // Use passive event listeners for better scroll performance
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
        
        // Add momentum scrolling to containers
        document.querySelectorAll('.workout-cards-container, .dialog-content').forEach(function(container) {
            container.style.webkitOverflowScrolling = 'touch';
        });
    }
    
    /**
     * Adjust dialogs for mobile
     */
    function adjustDialogsForMobile() {
        // Make dialogs full screen on very small devices
        if (window.innerWidth < 480) {
            document.querySelectorAll('.dialog-container').forEach(function(dialog) {
                dialog.style.width = '100%';
                dialog.style.height = '100%';
                dialog.style.maxHeight = '100%';
                dialog.style.borderRadius = '0';
            });
        }
    }
    
    /**
     * Enhance workout cards for mobile
     */
    function enhanceWorkoutCards() {
        // Make workout cards more swipeable
        const workoutCards = document.querySelector('.workout-cards');
        if (workoutCards) {
            let startX, moveX;
            
            workoutCards.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
            }, { passive: true });
            
            workoutCards.addEventListener('touchmove', function(e) {
                moveX = e.touches[0].clientX;
            }, { passive: true });
            
            workoutCards.addEventListener('touchend', function() {
                if (startX && moveX) {
                    const diff = startX - moveX;
                    
                    // Threshold for swipe detection
                    if (Math.abs(diff) > 50) {
                        if (diff > 0) {
                            // Swipe left - next
                            document.getElementById('scrollRight').click();
                        } else {
                            // Swipe right - previous
                            document.getElementById('scrollLeft').click();
                        }
                    }
                }
                
                // Reset values
                startX = null;
                moveX = null;
            });
        }
    }
    
    /**
     * Adjust layout for orientation changes
     */
    function adjustForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Landscape optimizations
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
            
            // Adjust expanded workout view for landscape
            const expandedContainer = document.querySelector('.expanded-workout-container');
            if (expandedContainer) {
                expandedContainer.style.width = '90%';
                expandedContainer.style.height = '90%';
            }
        } else {
            // Portrait optimizations
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
            
            // Reset expanded workout view for portrait
            const expandedContainer = document.querySelector('.expanded-workout-container');
            if (expandedContainer) {
                expandedContainer.style.width = '95%';
                expandedContainer.style.height = 'auto';
            }
        }
    }
}); 