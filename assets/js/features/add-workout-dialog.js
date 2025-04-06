// DOM Elements
let dialogOverlay;
let openDialogBtn;
let cancelDialogBtn;
let addWorkoutBtn;
let workoutForm;
let videoUrlInput;
let videoPreview;
let videoThumbnailImg;
let videoTitleInput;
let iconSelector;
let selectedIconInput;

// Import Firebase functions
import { saveWorkout } from '../core/firebase-db.js';
import { auth } from '../core/firebase-config.js';

// Global variable to track if saving to Firebase is available
let canSaveToFirebase = true;

// Error message elements
let titleError;
let videoUrlError;

// Available icons
const availableIcons = [
    { value: 'fitness_center', label: 'Weights' },
    { value: 'directions_run', label: 'Running' },
    { value: 'self_improvement', label: 'Yoga' },
    { value: 'local_fire_department', label: 'HIIT' },
    { value: 'pool', label: 'Swimming' },
    { value: 'pedal_bike', label: 'Cycling' }
];

// Initialize the dialog
function initDialog() {
    console.log("Initializing add workout dialog...");
    
    try {
        // Get DOM elements
        dialogOverlay = document.getElementById('dialogOverlay');
        openDialogBtn = document.getElementById('openAddWorkoutDialog');
        cancelDialogBtn = document.getElementById('cancelDialog');
        addWorkoutBtn = document.getElementById('addWorkout');
        workoutForm = document.getElementById('workoutForm');
        videoUrlInput = document.getElementById('videoUrl');
        videoPreview = document.getElementById('videoPreview');
        videoThumbnailImg = document.getElementById('videoThumbnail');
        videoTitleInput = document.getElementById('videoTitle');
        iconSelector = document.getElementById('iconSelector');
        selectedIconInput = document.getElementById('selectedIcon');
        
        // Get error message elements
        titleError = document.getElementById('titleError');
        videoUrlError = document.getElementById('videoUrlError');
        
        // Check if elements exist
        if (!dialogOverlay) {
            console.error("Dialog overlay not found! ID: dialogOverlay");
        } else {
            console.log("Dialog overlay found");
        }
        
        if (!openDialogBtn) {
            console.error("Open dialog button not found! ID: openAddWorkoutDialog");
        } else {
            console.log("Open dialog button found");
            // Add event listeners
            openDialogBtn.addEventListener('click', openDialog);
        }
        
        if (!cancelDialogBtn) {
            console.error("Cancel dialog button not found! ID: cancelDialog");
        } else {
            console.log("Cancel dialog button found");
            cancelDialogBtn.addEventListener('click', closeDialog);
        }
        
        if (!addWorkoutBtn) {
            console.error("Add workout button not found! ID: addWorkout");
        } else {
            console.log("Add workout button found");
            addWorkoutBtn.addEventListener('click', handleAddWorkout);
        }
        
        if (!videoUrlInput) {
            console.error("Video URL input not found! ID: videoUrl");
        } else {
            console.log("Video URL input found");
            // Video URL input change event
            videoUrlInput.addEventListener('input', handleVideoUrlChange);
        }
        
        if (!workoutForm) {
            console.error("Workout form not found! ID: workoutForm");
        } else {
            console.log("Workout form found");
            // Form validation events
            workoutForm.addEventListener('input', validateForm);
        }
        
        // Initialize icon selector
        renderIconSelector();
        console.log("Dialog initialization complete");
    } catch (error) {
        console.error("Error initializing dialog:", error);
    }
}

// Render icon selector
function renderIconSelector() {
    console.log("Rendering icon selector...");
    
    // Check for required elements
    if (!iconSelector) {
        console.error("Icon selector element not found! ID: iconSelector");
        return;
    }
    
    if (!selectedIconInput) {
        console.error("Selected icon input not found! ID: selectedIcon");
        return;
    }
    
    // Default to fitness_center if no value is set
    if (!selectedIconInput.value) {
        selectedIconInput.value = 'fitness_center';
    }
    
    // Clear existing content
    iconSelector.innerHTML = '';
    
    try {
        // Add icons
        availableIcons.forEach(icon => {
            const iconOption = document.createElement('div');
            iconOption.className = 'icon-option';
            if (icon.value === selectedIconInput.value) {
                iconOption.classList.add('selected');
            }
            
            iconOption.innerHTML = `
                <span class="material-icons">${icon.value}</span>
                <span>${icon.label}</span>
            `;
            
            iconOption.addEventListener('click', () => selectIcon(icon.value));
            
            iconSelector.appendChild(iconOption);
        });
        
        console.log("Icon selector rendered with", availableIcons.length, "icons");
    } catch (error) {
        console.error("Error rendering icon selector:", error);
    }
}

// Select icon
function selectIcon(iconValue) {
    console.log(`Selecting icon: ${iconValue}`);
    if (!selectedIconInput || !iconSelector) {
        console.error("Icon selector elements not found!");
        return;
    }
    
    selectedIconInput.value = iconValue;
    
    // Update selected state
    const iconOptions = iconSelector.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.classList.toggle('selected', option.querySelector('.material-icons').textContent === iconValue);
    });
}

// Open dialog
function openDialog() {
    console.log("Opening add workout dialog");
    // Immediately log all relevant DOM elements state
    console.log("dialogOverlay exists:", !!dialogOverlay);
    console.log("workoutForm exists:", !!workoutForm);
    console.log("selectedIconInput exists:", !!selectedIconInput);
    
    // Check DOM elements with detailed logging
    if (!dialogOverlay) {
        console.error("Dialog overlay not found! Attempting to retrieve it again...");
        dialogOverlay = document.getElementById('dialogOverlay');
        if (!dialogOverlay) {
            console.error("Dialog overlay still not found after retry!");
            return;
        }
    }
    
    if (!workoutForm) {
        console.error("Workout form not found! Attempting to retrieve it again...");
        workoutForm = document.getElementById('workoutForm');
        if (!workoutForm) {
            console.error("Workout form still not found after retry!");
            return;
        }
    }
    
    if (!selectedIconInput) {
        console.error("Selected icon input not found! Attempting to retrieve it again...");
        selectedIconInput = document.getElementById('selectedIcon');
        if (!selectedIconInput) {
            console.error("Selected icon input still not found after retry!");
            return;
        }
    }
    
    console.log("All required elements found, proceeding with dialog open");
    
    // Reset form
    workoutForm.reset();
    selectedIconInput.value = 'fitness_center';
    renderIconSelector();
    
    // Hide video preview
    if (videoPreview) {
        videoPreview.style.display = 'none';
    }
    
    // Ensure dialog container is visible and properly positioned
    const dialogContainer = dialogOverlay.querySelector('.dialog-container');
    if (dialogContainer) {
        console.log("Dialog container found, ensuring it's visible");
        dialogContainer.style.display = 'block';
    } else {
        console.error("Dialog container not found inside the overlay!");
    }
    
    // Show dialog - use multiple display techniques to ensure visibility
    console.log("Setting dialog to display:flex and adding visible class");
    dialogOverlay.style.cssText = "display: flex !important; opacity: 1 !important;";
    dialogOverlay.classList.add('visible');
    
    // Force repaint
    void dialogOverlay.offsetWidth;
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    console.log("Dialog should now be visible. Current styles:", 
        window.getComputedStyle(dialogOverlay).display,
        "Opacity:", window.getComputedStyle(dialogOverlay).opacity,
        "Z-index:", window.getComputedStyle(dialogOverlay).zIndex);
}

// Close dialog
function closeDialog() {
    console.log("Closing add workout dialog");
    if (!dialogOverlay) {
        console.error("Dialog overlay not found!");
        return;
    }
    
    dialogOverlay.classList.remove('visible'); // Remove visible class
    setTimeout(() => {
        dialogOverlay.style.display = 'none';
    }, 300); // Wait for animation if any
    document.body.style.overflow = ''; // Restore scrolling
    
    // Reset form errors
    resetFormErrors();
}

// Reset form errors
function resetFormErrors() {
    console.log("Resetting form errors");
    if (titleError) titleError.style.display = 'none';
    if (videoUrlError) videoUrlError.style.display = 'none';
}

// Handle video URL change
function handleVideoUrlChange() {
    console.log("Video URL changed");
    if (!videoUrlInput || !videoPreview || !videoThumbnailImg) {
        console.error("Video elements not found!");
        return;
    }
    
    const url = videoUrlInput.value.trim();
    
    if (url && isValidYoutubeUrl(url)) {
        const videoId = getYoutubeVideoId(url);
        if (videoId) {
            // Set thumbnail
            videoThumbnailImg.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            
            // Set default video title if none is provided
            if (videoTitleInput && !videoTitleInput.value) {
                const titleInput = document.getElementById('title');
                videoTitleInput.value = titleInput ? titleInput.value || 'Workout Video' : 'Workout Video';
            }
            
            // Show video preview
            videoPreview.style.display = 'block';
            
            // Hide error
            if (videoUrlError) {
                videoUrlError.style.display = 'none';
            }
        }
    } else if (url) {
        // Invalid URL entered
        if (videoUrlError) {
            videoUrlError.textContent = 'Please enter a valid YouTube URL';
            videoUrlError.style.display = 'block';
        }
        
        // Hide preview
        videoPreview.style.display = 'none';
    } else {
        // No URL entered
        videoPreview.style.display = 'none';
        
        if (videoUrlError) {
            videoUrlError.style.display = 'none';
        }
    }
}

// Validate form
function validateForm() {
    console.log("Validating form");
    if (!workoutForm) {
        console.error("Workout form not found!");
        return false;
    }
    
    // Get form fields
    const titleInput = document.getElementById('title');
    
    // Validate title
    if (titleInput && titleError) {
        if (!titleInput.value.trim()) {
            titleError.textContent = 'Title is required';
            titleError.style.display = 'block';
            titleInput.setCustomValidity('Title is required');
            return false;
        } else {
            titleError.style.display = 'none';
            titleInput.setCustomValidity('');
        }
    }
    
    // Validate video URL
    if (videoUrlInput && videoUrlError) {
        const url = videoUrlInput.value.trim();
        if (!url) {
            videoUrlError.textContent = 'Video URL is required';
            videoUrlError.style.display = 'block';
            videoUrlInput.setCustomValidity('Video URL is required');
            return false;
        } else if (!isValidYoutubeUrl(url)) {
            videoUrlError.textContent = 'Please enter a valid YouTube URL';
            videoUrlError.style.display = 'block';
            videoUrlInput.setCustomValidity('Please enter a valid YouTube URL');
            return false;
        } else {
            videoUrlError.style.display = 'none';
            videoUrlInput.setCustomValidity('');
        }
    }
    
    return true;
}

// Handle add workout
async function handleAddWorkout() {
    console.log("Handle add workout called");
    
    // Validate form
    if (!validateForm()) {
        console.error("Form validation failed");
        return;
    }
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const videoTitle = document.getElementById('videoTitle')?.value.trim() || '';
    const description = document.getElementById('description')?.value.trim() || ''; // Get description value
    const iconValue = document.getElementById('selectedIcon').value;
    
    console.log(`Title: ${title}, Video URL: ${videoUrl}, Video Title: ${videoTitle}, Icon: ${iconValue}, Description: ${description}`);
    
    // Extract video ID and create video object
    const videoId = getYoutubeVideoId(videoUrl);
    
    // Prepare workout data
    const workoutData = {
        title: title,
        videoUrl: videoUrl,
        videoTitle: videoTitle,
        icon: iconValue,
        description: description, // Add description to workout data
        createdAt: new Date().toISOString()
    };
    
    // Add video object if we have a valid YouTube URL
    if (videoId) {
        workoutData.video = {
            type: 'youtube',
            id: videoId,
            url: videoUrl,
            title: videoTitle || title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
    }
    
    console.log("Created workout object: ", workoutData);
    
    try {
        let success = false;
        let firestoreId = null;
        let localId = null;
        
        // Check if user is logged in to use Firebase and if we haven't had Firebase errors
        if (auth.currentUser && canSaveToFirebase) {
            try {
                console.log("User is logged in. Saving workout to Firebase...");
                firestoreId = await saveWorkout(workoutData);
                console.log("Workout saved to Firebase with ID:", firestoreId);
                
                // Add workout to window.workouts array for immediate UI update
                const newWorkout = {
                    ...workoutData,
                    id: firestoreId,
                    firebaseId: firestoreId,
                    isFavorite: false
                };
                
                if (window.workouts) {
                    window.workouts.push(newWorkout);
                    
                    // Update UI immediately
                    if (typeof window.renderWorkoutCards === 'function') {
                        window.renderWorkoutCards();
                        
                        if (typeof window.calculateMaxScroll === 'function') {
                            window.calculateMaxScroll();
                        }
                        
                        if (typeof window.updateScrollButtons === 'function') {
                            window.updateScrollButtons();
                        }
                    }
                }
                
                // Add workout to local storage as backup
                addWorkoutToLocalStorage({
                    ...workoutData,
                    id: firestoreId,
                    isFavorite: false
                });
                
                success = true;
            } catch (error) {
                console.error("Error saving to Firebase:", error);
                
                // If we get a permissions error, stop trying to use Firebase
                if (error.message && error.message.includes("Missing or insufficient permissions")) {
                    console.warn("Permissions error detected. Switching to local storage mode for future operations.");
                    canSaveToFirebase = false;
                }
                
                // Fallback to local storage
                localId = Date.now();
                success = addWorkoutToLocalStorage({
                    ...workoutData,
                    id: localId,
                    isFavorite: false
                });
                
                // Add to window.workouts for immediate UI update
                if (window.workouts && success) {
                    const newWorkout = {
                        ...workoutData,
                        id: localId,
                        isFavorite: false
                    };
                    window.workouts.push(newWorkout);
                    
                    // Update UI immediately
                    if (typeof window.renderWorkoutCards === 'function') {
                        window.renderWorkoutCards();
                        
                        if (typeof window.calculateMaxScroll === 'function') {
                            window.calculateMaxScroll();
                        }
                        
                        if (typeof window.updateScrollButtons === 'function') {
                            window.updateScrollButtons();
                        }
                    }
                }
            }
        } else {
            // User not logged in or Firebase previously failed, use local storage only
            console.log("User not logged in or Firebase unavailable. Saving workout to local storage only.");
            localId = Date.now();
            success = addWorkoutToLocalStorage({
                ...workoutData,
                id: localId,
                isFavorite: false
            });
            
            // Add to window.workouts for immediate UI update
            if (window.workouts && success) {
                const newWorkout = {
                    ...workoutData,
                    id: localId,
                    isFavorite: false
                };
                window.workouts.push(newWorkout);
                
                // Update UI immediately
                if (typeof window.renderWorkoutCards === 'function') {
                    window.renderWorkoutCards();
                    
                    if (typeof window.calculateMaxScroll === 'function') {
                        window.calculateMaxScroll();
                    }
                    
                    if (typeof window.updateScrollButtons === 'function') {
                        window.updateScrollButtons();
                    }
                }
            }
        }
        
        if (success) {
            console.log("Workout added successfully");
            
            // Create a record of the newly added workout for UI update
            let addedWorkout = {
                ...workoutData,
                id: firestoreId || localId,
                isFavorite: false
            };
            
            // Add Firebase ID if available
            if (firestoreId) {
                addedWorkout.firebaseId = firestoreId;
            }
            
            // Ensure video data is complete (sometimes might be lost when saving to Firebase)
            if (!addedWorkout.video && addedWorkout.videoUrl) {
                const videoId = getYoutubeVideoId(addedWorkout.videoUrl);
                if (videoId) {
                    addedWorkout.video = {
                        type: 'youtube',
                        url: addedWorkout.videoUrl,
                        title: addedWorkout.videoTitle || addedWorkout.title,
                        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    };
                }
            }
            
            // Trigger UI update with workout data
            const event = new CustomEvent('workoutAdded', {
                detail: {
                    workout: addedWorkout
                }
            });
            document.dispatchEvent(event);
            
            // Close dialog
            closeDialog();
        } else {
            throw new Error("Failed to add workout.");
        }
    } catch (error) {
        console.error("Error adding workout:", error);
        alert(`Error: Could not add workout. ${error.message}`);
    }
}

// Helper function to add workout to localStorage
function addWorkoutToLocalStorage(workout) {
    try {
        // Get existing workouts
        const storedWorkouts = localStorage.getItem('workouts');
        const workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
        
        // Add new workout
        workouts.push(workout);
        
        // Save back to localStorage
        localStorage.setItem('workouts', JSON.stringify(workouts));
        
        console.log("Workout saved to localStorage");
        return true;
    } catch (error) {
        console.error("Error saving to localStorage:", error);
        return false;
    }
}

// Check if URL is a valid YouTube URL
function isValidYoutubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url);
}

// Get YouTube video ID from URL
function getYoutubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Make sure DOM is fully loaded before initializing
function ensureDialogInitialization() {
    console.log("Ensuring add workout dialog initialization");
    try {
        initDialog();
    } catch (error) {
        console.error("Error during add workout dialog initialization:", error);
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', ensureDialogInitialization);

// Also try to initialize if the document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document already loaded, initializing add workout dialog");
    setTimeout(ensureDialogInitialization, 100); // Small delay to ensure DOM is ready
} 