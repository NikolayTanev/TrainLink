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
let scheduleWorkoutCheckbox;
let scheduleOptionsContainer;
let repeatOptionSelect;
let customRepeatOptionsContainer;

// Error message elements
let titleError;
let descriptionError;
let durationError;
let difficultyError;
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
    scheduleWorkoutCheckbox = document.getElementById('scheduleWorkout');
    scheduleOptionsContainer = document.getElementById('scheduleOptions');
    repeatOptionSelect = document.getElementById('repeatOption');
    customRepeatOptionsContainer = document.getElementById('customRepeatOptions');
    
    // Get error message elements
    titleError = document.getElementById('titleError');
    descriptionError = document.getElementById('descriptionError');
    durationError = document.getElementById('durationError');
    difficultyError = document.getElementById('difficultyError');
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
    
    if (!scheduleWorkoutCheckbox) {
        console.error("Schedule workout checkbox not found!");
    } else {
        // Schedule options events
        scheduleWorkoutCheckbox.addEventListener('change', toggleScheduleOptions);
    }
    
    if (!repeatOptionSelect) {
        console.error("Repeat option select not found!");
    } else {
        repeatOptionSelect.addEventListener('change', toggleCustomRepeatOptions);
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
    
    // Hide schedule options
    if (scheduleOptionsContainer) {
        scheduleOptionsContainer.style.display = 'none';
    }
    
    if (customRepeatOptionsContainer) {
        customRepeatOptionsContainer.style.display = 'none';
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
    if (descriptionError) descriptionError.style.display = 'none';
    if (durationError) durationError.style.display = 'none';
    if (difficultyError) difficultyError.style.display = 'none';
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
                videoTitleInput.value = `${titleInput ? titleInput.value || 'Workout' : 'Workout'} Video`;
            }
            
            // Show video preview
            videoPreview.style.display = 'block';
            
            // Hide error
            if (videoUrlError) videoUrlError.style.display = 'none';
        }
    } else if (url) {
        // Show error for invalid URL
        if (videoUrlError) videoUrlError.style.display = 'block';
        
        // Hide video preview
        videoPreview.style.display = 'none';
    } else {
        // Hide error and preview for empty URL
        if (videoUrlError) videoUrlError.style.display = 'none';
        videoPreview.style.display = 'none';
    }
}

// Toggle schedule options
function toggleScheduleOptions() {
    console.log("Toggle schedule options called");
    if (!scheduleOptionsContainer || !scheduleWorkoutCheckbox) {
        console.error("Schedule options elements not found!");
        return;
    }
    
    scheduleOptionsContainer.style.display = scheduleWorkoutCheckbox.checked ? 'block' : 'none';
    
    // Set default date and time if checked
    if (scheduleWorkoutCheckbox.checked) {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const workoutDateInput = document.getElementById('workoutDate');
        const workoutTimeInput = document.getElementById('workoutTime');
        
        if (workoutDateInput && workoutTimeInput) {
            workoutDateInput.value = dateString;
            workoutTimeInput.value = timeString;
        } else {
            console.error("Workout date/time inputs not found!");
        }
    }
    
    // Validate form after toggling
    validateForm();
}

// Toggle custom repeat options
function toggleCustomRepeatOptions() {
    console.log("Toggle custom repeat options called");
    if (!customRepeatOptionsContainer || !repeatOptionSelect) {
        console.error("Custom repeat options elements not found!");
        return;
    }
    
    customRepeatOptionsContainer.style.display = repeatOptionSelect.value === 'custom' ? 'block' : 'none';
}

// Validate form
function validateForm() {
    console.log("Validating form");
    if (!workoutForm || !addWorkoutBtn) {
        console.error("Form elements not found!");
        return;
    }
    
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const durationInput = document.getElementById('duration');
    const difficultyInput = document.getElementById('difficulty');
    
    if (!titleInput || !descriptionInput || !durationInput || !difficultyInput) {
        console.error("Form input elements not found!");
        return;
    }
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const duration = durationInput.value.trim();
    const difficulty = difficultyInput.value;
    const videoUrl = videoUrlInput ? videoUrlInput.value.trim() : '';
    
    // Validate required fields
    if (titleError) titleError.style.display = title ? 'none' : 'block';
    if (descriptionError) descriptionError.style.display = description ? 'none' : 'block';
    if (durationError) durationError.style.display = duration ? 'none' : 'block';
    if (difficultyError) difficultyError.style.display = difficulty ? 'none' : 'block';
    
    // Validate video URL if provided
    if (videoUrl && videoUrlError) {
        videoUrlError.style.display = isValidYoutubeUrl(videoUrl) ? 'none' : 'block';
    } else if (videoUrlError) {
        videoUrlError.style.display = 'none';
    }
    
    // Validate schedule options if checked
    let scheduleValid = true;
    if (scheduleWorkoutCheckbox && scheduleWorkoutCheckbox.checked) {
        const workoutDateInput = document.getElementById('workoutDate');
        const workoutTimeInput = document.getElementById('workoutTime');
        
        if (workoutDateInput && workoutTimeInput) {
            const workoutDate = workoutDateInput.value;
            const workoutTime = workoutTimeInput.value;
            
            if (!workoutDate || !workoutTime) {
                scheduleValid = false;
            }
        } else {
            scheduleValid = false;
        }
    }
    
    // Enable/disable add button
    addWorkoutBtn.disabled = !(
        title && 
        description && 
        duration && 
        difficulty && 
        (!videoUrl || isValidYoutubeUrl(videoUrl)) &&
        (!scheduleWorkoutCheckbox.checked || scheduleValid)
    );
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
    const description = document.getElementById('description').value;
    const duration = document.getElementById('duration').value;
    const difficulty = document.getElementById('difficulty').value;
    const icon = selectedIconInput.value;
    
    // Create workout object
    const workoutData = {
        title,
        description,
        duration,
        difficulty,
        icon
    };
    
    // Add video information if provided
    const videoUrl = videoUrlInput.value.trim();
    if (videoUrl) {
        if (isValidYoutubeUrl(videoUrl)) {
            workoutData.videoUrl = videoUrl;
            workoutData.videoTitle = videoTitleInput.value || title;
        } else {
            videoUrlError.style.display = 'block';
            return;
        }
    }
    
    console.log("Created workout object: ", workoutData);
    
    try {
        // Check if window.addWorkout is available
        if (typeof window.addWorkout !== 'function') {
            console.error("window.addWorkout is not a function");
            alert("Error: Could not add workout. The add workout function is not available.");
            return;
        }
        
        // Add workout to list
        const success = window.addWorkout(workoutData);
        
        if (success) {
            console.log("Workout added to list");
            
            // Check if workout should be scheduled
            if (scheduleWorkoutCheckbox && scheduleWorkoutCheckbox.checked) {
                const workoutDate = document.getElementById('workoutDate').value;
                const workoutTime = document.getElementById('workoutTime').value;
                const repeatOption = document.getElementById('repeatOption').value;
                
                if (!workoutDate || !workoutTime) {
                    alert("Please select a date and time for the scheduled workout");
                    return;
                }
                
                // Get the workout ID - use the latest workout
                let workoutId;
                
                try {
                    // Get workouts from localStorage
                    const storedWorkouts = JSON.parse(localStorage.getItem('workouts') || '[]');
                    if (storedWorkouts.length > 0) {
                        // Use the ID of the last added workout
                        workoutId = storedWorkouts[storedWorkouts.length - 1].id;
                    } else {
                        console.error("No workouts found in localStorage");
                        alert("Error: Could not schedule workout. No workouts found.");
                        return;
                    }
                } catch (error) {
                    console.error("Error getting workouts from localStorage:", error);
                    alert("Error: Could not schedule workout. Could not access workout data.");
                    return;
                }
                
                // Create schedule data
                const scheduleData = {
                    date: workoutDate,
                    time: workoutTime,
                    repeat: repeatOption
                };
                
                // Add custom repeat options if selected
                if (repeatOption === 'custom') {
                    const repeatDays = Array.from(document.querySelectorAll('input[name="repeatDays"]:checked')).map(cb => cb.value);
                    const repeatFrequency = document.getElementById('repeatFrequency').value;
                    const repeatDay = document.getElementById('repeatDay').value;
                    
                    scheduleData.customOptions = {
                        days: repeatDays,
                        frequency: repeatFrequency,
                        day: repeatDay
                    };
                }
                
                console.log("Scheduling workout with data:", scheduleData);
                
                // Check if window.scheduleWorkout is available
                if (typeof window.scheduleWorkout !== 'function') {
                    console.error("window.scheduleWorkout is not a function");
                    alert("Error: Could not schedule workout. The schedule workout function is not available.");
                    return;
                }
                
                // Schedule the workout
                const scheduled = window.scheduleWorkout(workoutId, scheduleData);
                if (scheduled) {
                    console.log("Workout scheduled successfully");
                }
            }
            
            // Close dialog
            closeDialog();
        }
    } catch (error) {
        console.error("Error adding workout:", error);
        alert(`Error: Could not add workout. ${error.message}`);
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
    setTimeout(initDialog, 100); // Small delay to ensure all scripts are loaded
}); 