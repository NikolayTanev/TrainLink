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
    if (!openDialogBtn) {
        console.error("Open dialog button not found!");
    } else {
        console.log("Open dialog button found");
        // Add event listeners
        openDialogBtn.addEventListener('click', openDialog);
    }
    
    if (!cancelDialogBtn) {
        console.error("Cancel dialog button not found!");
    } else {
        cancelDialogBtn.addEventListener('click', closeDialog);
    }
    
    if (!addWorkoutBtn) {
        console.error("Add workout button not found!");
    } else {
        addWorkoutBtn.addEventListener('click', handleAddWorkout);
    }
    
    if (!videoUrlInput) {
        console.error("Video URL input not found!");
    } else {
        // Video URL input change event
        videoUrlInput.addEventListener('input', handleVideoUrlChange);
    }
    
    if (!workoutForm) {
        console.error("Workout form not found!");
    } else {
        // Form validation events
        workoutForm.addEventListener('input', validateForm);
    }
    
    // Populate icon selector
    if (iconSelector) {
        renderIconSelector();
    } else {
        console.error("Icon selector not found!");
    }
    
    console.log("Add workout dialog initialization complete");
}

// Render icon selector
function renderIconSelector() {
    console.log("Rendering icon selector...");
    if (!iconSelector || !selectedIconInput) {
        console.error("Icon selector elements not found!");
        return;
    }
    
    iconSelector.innerHTML = '';
    
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
    
    console.log("Icon selector rendering complete");
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
    if (!dialogOverlay || !workoutForm || !selectedIconInput) {
        console.error("Dialog elements not found!");
        return;
    }
    
    // Reset form
    workoutForm.reset();
    selectedIconInput.value = 'fitness_center';
    renderIconSelector();
    
    // Hide video preview
    if (videoPreview) {
        videoPreview.style.display = 'none';
    }
    
    // Show dialog
    dialogOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close dialog
function closeDialog() {
    console.log("Closing add workout dialog");
    if (!dialogOverlay) {
        console.error("Dialog overlay not found!");
        return;
    }
    
    dialogOverlay.style.display = 'none';
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
        return;
    }
    
    // Get form fields
    const titleInput = document.getElementById('title');
    
    // Validate title
    if (titleInput && titleError) {
        if (!titleInput.value.trim()) {
            titleError.textContent = 'Title is required';
            titleError.style.display = 'block';
            titleInput.setCustomValidity('Title is required');
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
        } else if (!isValidYoutubeUrl(url)) {
            videoUrlError.textContent = 'Please enter a valid YouTube URL';
            videoUrlError.style.display = 'block';
            videoUrlInput.setCustomValidity('Please enter a valid YouTube URL');
        } else {
            videoUrlError.style.display = 'none';
            videoUrlInput.setCustomValidity('');
        }
    }
}

// Handle add workout
async function handleAddWorkout() {
    console.log("Handle add workout called");
    validateForm();
    
    // Check if form is valid
    if (!workoutForm.checkValidity()) {
        console.log("Form is invalid");
        return;
    }
    
    // Get form data
    const title = document.getElementById('title').value;
    const icon = selectedIconInput.value;
    const videoUrl = videoUrlInput.value.trim();
    const videoTitle = videoTitleInput.value || title;
    
    if (!videoUrl || !isValidYoutubeUrl(videoUrl)) {
        if (videoUrlError) {
            videoUrlError.style.display = 'block';
        }
        return;
    }
    
    // Create workout object
    const workoutData = {
        title,
        // Add empty/placeholder values for backward compatibility
        description: '',
        duration: '',
        difficulty: '',
        icon,
        videoUrl,
        videoTitle
    };
    
    console.log("Created workout object: ", workoutData);
    
    try {
        let success = false;
        
        // Check if user is logged in to use Firebase and if we haven't had Firebase errors
        if (auth.currentUser && canSaveToFirebase) {
            try {
                console.log("User is logged in. Saving workout to Firebase...");
                const firestoreId = await saveWorkout(workoutData);
                console.log("Workout saved to Firebase with ID:", firestoreId);
                
                // Add workout to local storage as backup
                addWorkoutToLocalStorage({
                    ...workoutData,
                    id: Date.now(),  // Use timestamp as ID for local storage
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
                success = addWorkoutToLocalStorage({
                    ...workoutData,
                    id: Date.now(),
                    isFavorite: false
                });
            }
        } else {
            // User not logged in or Firebase previously failed, use local storage only
            console.log("User not logged in or Firebase unavailable. Saving workout to local storage only.");
            success = addWorkoutToLocalStorage({
                ...workoutData,
                id: Date.now(),
                isFavorite: false
            });
        }
        
        if (success) {
            console.log("Workout added successfully");
            
            // Trigger UI update
            const event = new CustomEvent('workoutAdded');
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
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, initializing add workout dialog");
    initDialog();
}); 