/**
 * Mobile Enhancements for TrainLink
 * Improves the user experience on mobile devices
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    // Check if we're on a tablet device
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    if (isMobile) {
        // Apply mobile-specific enhancements
        enhanceMobileExperience();
        
        // Set up observer for dynamically added elements
        setupMutationObserver();
    }
    
    if (isTablet) {
        // Apply tablet-specific enhancements
        enhanceTabletExperience();
    }
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            adjustForOrientation();
            fixFavoriteButtons(); // Fix favorite buttons after orientation change
            
            // Fix carousel display on orientation change for tablets
            if (window.innerWidth > 768 && window.innerWidth <= 1024) {
                fixTabletCarousel();
            }
        }, 300); // Small delay to ensure the orientation change is complete
    });
    
    // Listen for resize events (for testing in dev tools)
    window.addEventListener('resize', function() {
        if ((window.innerWidth <= 768 && !isMobile) || 
            (window.innerWidth > 768 && isMobile)) {
            // Reload the page if crossing the mobile threshold
            window.location.reload();
        } else if (window.innerWidth <= 768) {
            // If still in mobile mode but resized, fix the favorite buttons
            fixFavoriteButtons();
        } else if (window.innerWidth > 768 && window.innerWidth <= 1024) {
            // If in tablet mode, ensure carousel displays correctly
            fixTabletCarousel();
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
        
        // Fix favorite buttons
        fixFavoriteButtons();
    }
    
    /**
     * Set up MutationObserver to monitor for dynamically added favorite buttons
     */
    function setupMutationObserver() {
        // Create a new observer
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // Check for new favorite buttons
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            // Check if the node itself is a favorite button
                            if (node.classList && 
                                (node.classList.contains('favorite-button') || 
                                 node.classList.contains('expanded-favorite'))) {
                                fixFavoriteButton(node);
                            }
                            
                            // Check for favorite buttons within the added node
                            const favoriteButtons = node.querySelectorAll('.favorite-button, .expanded-favorite');
                            if (favoriteButtons.length > 0) {
                                favoriteButtons.forEach(fixFavoriteButton);
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing the document body for DOM changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Fix a single favorite button
     */
    function fixFavoriteButton(button) {
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.minWidth = '36px';
        button.style.minHeight = '36px';
        button.style.padding = '0';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.transform = 'none';
        button.style.boxSizing = 'content-box';
        
        const icon = button.querySelector('.material-icons');
        if (icon) {
            icon.style.fontSize = '20px';
            icon.style.margin = '0';
        }
    }
    
    /**
     * Fix favorite buttons to prevent squishing on mobile
     */
    function fixFavoriteButtons() {
        document.querySelectorAll('.favorite-button, .expanded-favorite').forEach(fixFavoriteButton);
    }
    
    /**
     * Improve touch targets for mobile users
     */
    function improveTouchTargets() {
        // Make buttons more tappable
        document.querySelectorAll('button, .workout-actions > *').forEach(function(button) {
            if (!button.classList.contains('carousel-arrow') && 
                !button.classList.contains('favorite-button') && 
                !button.classList.contains('expanded-favorite')) {
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
    
    /**
     * Apply tablet-specific enhancements
     */
    function enhanceTabletExperience() {
        // Fix carousel display for tablets
        fixTabletCarousel();
        
        // Improve touch targets for tablets
        improveTabletTouchTargets();
        
        // Fix favorite buttons
        fixFavoriteButtons();
        
        // Enhance carousel scrolling for tablets
        enhanceTabletCarouselScrolling();
    }
    
    /**
     * Fix carousel display for tablets
     */
    function fixTabletCarousel() {
        // Ensure carousel arrows are visible
        document.querySelectorAll('.carousel-arrow').forEach(function(arrow) {
            arrow.style.display = 'flex';
            arrow.style.opacity = '1';
        });
        
        // Ensure workout cards display in a row
        const workoutCards = document.querySelectorAll('.workout-card');
        if (workoutCards.length > 0) {
            workoutCards.forEach(function(card) {
                card.style.flex = '0 0 calc(50% - 20px)';
                card.style.marginRight = '15px';
            });
        }
        
        // Ensure workout cards container has proper overflow
        const cardsContainer = document.querySelector('.workout-cards-container');
        if (cardsContainer) {
            cardsContainer.style.overflow = 'hidden';
        }
        
        // Ensure workout cards wrapper has proper display
        const cardsWrapper = document.querySelector('.workout-cards');
        if (cardsWrapper) {
            cardsWrapper.style.display = 'flex';
            cardsWrapper.style.flexWrap = 'nowrap';
        }
    }
    
    /**
     * Improve touch targets for tablet users
     */
    function improveTabletTouchTargets() {
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
     * Enhance carousel scrolling for tablets
     */
    function enhanceTabletCarouselScrolling() {
        // Get carousel elements
        const leftArrow = document.getElementById('scrollLeft');
        const rightArrow = document.getElementById('scrollRight');
        const cardsContainer = document.querySelector('.workout-cards');
        
        if (!leftArrow || !rightArrow || !cardsContainer) {
            return;
        }
        
        // Calculate how many cards to show at once based on screen width
        const cardsToShow = window.innerWidth >= 768 ? 2 : 1;
        
        // Calculate card width including margin
        const cardWidth = cardsContainer.querySelector('.workout-card')?.offsetWidth || 0;
        const cardMargin = 15; // From CSS
        const scrollAmount = (cardWidth + cardMargin) * cardsToShow;
        
        // Override click handlers for smoother scrolling on tablets
        leftArrow.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get current scroll position
            const currentScroll = cardsContainer.style.transform ? 
                parseInt(cardsContainer.style.transform.replace('translateX(', '').replace('px)', '')) : 0;
            
            // Calculate new scroll position
            const newScroll = Math.min(0, currentScroll + scrollAmount);
            
            // Apply smooth scroll
            cardsContainer.style.transform = `translateX(${newScroll}px)`;
            
            // Update arrow states
            updateArrowStates(newScroll);
        });
        
        rightArrow.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get current scroll position
            const currentScroll = cardsContainer.style.transform ? 
                parseInt(cardsContainer.style.transform.replace('translateX(', '').replace('px)', '')) : 0;
            
            // Calculate max scroll amount
            const maxScroll = -(cardsContainer.scrollWidth - cardsContainer.parentElement.offsetWidth);
            
            // Calculate new scroll position
            const newScroll = Math.max(maxScroll, currentScroll - scrollAmount);
            
            // Apply smooth scroll
            cardsContainer.style.transform = `translateX(${newScroll}px)`;
            
            // Update arrow states
            updateArrowStates(newScroll);
        });
        
        // Function to update arrow states
        function updateArrowStates(currentScroll) {
            const maxScroll = -(cardsContainer.scrollWidth - cardsContainer.parentElement.offsetWidth);
            
            // Left arrow should be disabled if at the beginning
            leftArrow.classList.toggle('disabled', currentScroll >= 0);
            
            // Right arrow should be disabled if at the end
            rightArrow.classList.toggle('disabled', currentScroll <= maxScroll);
        }
        
        // Initialize arrow states
        updateArrowStates(0);
    }
}); 