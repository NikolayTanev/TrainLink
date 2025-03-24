// Global variables
let workouts = [];
let scheduledWorkouts = [];
let workoutLogs = [];
let selectedWorkout = null;
let currentWorkoutId = null;
let currentScheduleId = null; // For tracking which workout is being deleted or rescheduled
let useFirebase = false; // Flag to determine if we should use Firebase

// Import Firebase modules
import { auth } from './firebase-config.js';
import { 
    saveWorkout, 
    getUserWorkouts, 
    updateWorkout, 
    deleteWorkout as deleteWorkoutFromFirebase,
    migrateLocalWorkouts,
    hasUserWorkouts,
    saveWorkoutLog,
    getUserWorkoutLogs,
    saveScheduledWorkout,
    getUserScheduledWorkouts,
    updateScheduledWorkout,
    deleteScheduledWorkout as deleteScheduledWorkoutFromFirebase
} from './firebase-db.js';

// DOM Elements
let workoutCardsContainer;
let scrollLeftBtn;
let scrollRightBtn;
let dateFilterBtns;
let logEntriesContainer;
let upcomingWorkoutsContainer;
let calendarContainer;
let expandedWorkoutOverlay;
let expandedWorkoutContainer;
let deleteWorkoutOptionsDialog;
let rescheduleWorkoutDialog;
let scheduleWorkoutDialog; // Making this a global variable

// Initialize DOM elements
function initDOMElements() {
    console.log("Initializing DOM elements...");
    workoutCardsContainer = document.getElementById('workoutCards');
    scrollLeftBtn = document.getElementById('scrollLeft');
    scrollRightBtn = document.getElementById('scrollRight');
    dateFilterBtns = document.querySelectorAll('.date-filter-btn');
    logEntriesContainer = document.getElementById('logEntries');
    upcomingWorkoutsContainer = document.getElementById('upcomingWorkouts');
    calendarContainer = document.getElementById('calendarContainer');
    expandedWorkoutOverlay = document.getElementById('expandedWorkoutOverlay');
    expandedWorkoutContainer = document.getElementById('expandedWorkoutContainer');
    deleteWorkoutOptionsDialog = document.getElementById('deleteWorkoutOptionsDialog');
    rescheduleWorkoutDialog = document.getElementById('rescheduleWorkoutDialog');

    // Initialize Schedule workout dialog
    scheduleWorkoutDialog = document.getElementById('scheduleWorkoutDialog');
}

// Carousel variables
let scrollPosition = 0;
let maxScrollPosition = 0;
let cardWidth = 280; // Width of a workout card + margin
let visibleCards = 3;

// Date filter
let dateFilter = 'all';

// Calendar variables
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// Load workouts - now with Firebase support
async function loadWorkouts() {
    console.log("Loading workouts...");
    try {
        // Check if user is logged in and if we should use Firebase
        const user = auth.currentUser;
        useFirebase = !!user;
        
        if (useFirebase) {
            console.log("User is logged in. Loading workouts from Firebase...");
            try {
                const firestoreWorkouts = await getUserWorkouts();
                // Process workouts to ensure they have the right structure
                workouts = firestoreWorkouts.map(workout => {
                    // Ensure the ID from Firestore is properly assigned
                    if (workout.firebaseId && !workout.id) {
                        workout.id = workout.firebaseId;
                    }
                    
                    // Add video information if videoUrl exists but video object doesn't
                    if (workout.videoUrl && !workout.video) {
                        const videoId = getYoutubeVideoId(workout.videoUrl);
                        workout.video = {
                            type: 'youtube',
                            url: workout.videoUrl,
                            title: workout.videoTitle || workout.title,
                            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
                        };
                    }
                    return workout;
                });
                console.log(`Loaded ${workouts.length} workouts from Firebase`);
                console.log("Processed workouts:", workouts);
                
                // Load scheduled workouts after workouts are loaded
                await loadScheduledWorkouts();
            } catch (error) {
                console.error("Error loading workouts from Firebase:", error);
                workouts = [];
                
                // Even if workouts fail to load, try to load scheduled workouts
                await loadScheduledWorkouts();
            }
        } else {
            console.log("User not logged in. Loading workouts from localStorage...");
            // Load from localStorage
            const storedWorkouts = localStorage.getItem('workouts');
            workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            console.log(`Loaded ${workouts.length} workouts from localStorage`);
            
            // Load scheduled workouts after workouts are loaded
            await loadScheduledWorkouts();
        }
    } catch (error) {
        console.error("Error in loadWorkouts:", error);
        workouts = [];
        
        // Try to load scheduled workouts even if there was an error
        try {
            await loadScheduledWorkouts();
        } catch (scheduledError) {
            console.error("Error loading scheduled workouts after workouts error:", scheduledError);
        }
    }
}

// Save workouts - now with Firebase support
async function saveWorkouts() {
    console.log("Saving workouts...");
    
    // Always save to localStorage as a backup
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    // If user is logged in, we don't need to do anything here for Firebase
    // as individual CRUD operations are handled by their specific functions
}

// Load scheduled workouts from Firebase or localStorage
async function loadScheduledWorkouts() {
    console.log("Loading scheduled workouts...");
    try {
        // Clear existing scheduled workouts
        scheduledWorkouts = [];
        
        const user = auth.currentUser;
        useFirebase = !!user;
        
        if (useFirebase) {
            console.log("User is logged in. Loading scheduled workouts from Firebase...");
            try {
                // Load from Firebase
                scheduledWorkouts = await getUserScheduledWorkouts();
                
                // Process scheduled workouts to handle any special data
                scheduledWorkouts = scheduledWorkouts.map(scheduled => {
                    // Convert Firebase timestamp to Date object if needed
                    if (scheduled.date && typeof scheduled.date.toDate === 'function') {
                        scheduled.date = scheduled.date.toDate().toISOString().split('T')[0];
                    }
                    
                    // Ensure excludeDates is an array
                    if (!scheduled.excludeDates) {
                        scheduled.excludeDates = [];
                    }
                    
                    return scheduled;
                });
                
                console.log(`Loaded ${scheduledWorkouts.length} scheduled workouts from Firebase`);
                
                // Wait a moment to ensure workouts are loaded before fixing references
                setTimeout(() => {
                    fixWorkoutReferences();
                }, 500);
            } catch (error) {
                console.error("Error loading scheduled workouts from Firebase:", error);
                
                // Fallback to localStorage
        const storedScheduled = localStorage.getItem('scheduledWorkouts');
        scheduledWorkouts = storedScheduled ? JSON.parse(storedScheduled) : [];
                console.log(`Fallback: Loaded ${scheduledWorkouts.length} scheduled workouts from localStorage`);
                setTimeout(() => {
                    fixWorkoutReferences();
                }, 500);
            }
        } else {
            console.log("User not logged in. Loading scheduled workouts from localStorage...");
            // Load from localStorage
            const storedScheduled = localStorage.getItem('scheduledWorkouts');
            scheduledWorkouts = storedScheduled ? JSON.parse(storedScheduled) : [];
            console.log(`Loaded ${scheduledWorkouts.length} scheduled workouts from localStorage`);
            setTimeout(() => {
                fixWorkoutReferences();
            }, 500);
        }
        
        // Log excluded dates for debugging
        scheduledWorkouts.forEach(workout => {
            if (workout.excludeDates && workout.excludeDates.length > 0) {
                console.log(`Loaded workout ${workout.id} with excluded dates:`, workout.excludeDates);
            }
        });
    } catch (error) {
        console.error("Error loading scheduled workouts:", error);
        scheduledWorkouts = [];
    }
}

// Fix references between scheduled workouts and workouts
function fixWorkoutReferences() {
    console.log("Fixing workout references for scheduled workouts...");
    console.log("Available workouts:", workouts.map(w => ({ id: w.id, title: w.title, firebaseId: w.firebaseId })));
    console.log("Scheduled workouts before fixing:", scheduledWorkouts.length);
    
    if (!workouts || workouts.length === 0) {
        console.warn("No workouts available to fix references");
        return;
    }
    
    // Remove any scheduled workouts with undefined workoutId (could be stale)
    const validScheduledWorkouts = scheduledWorkouts.filter(scheduled => {
        if (!scheduled.workoutId && !scheduled.originalWorkoutId && !scheduled.title) {
            console.warn("Found invalid scheduled workout with no identifiers:", scheduled);
            return false;
        }
        return true;
    });
    
    if (validScheduledWorkouts.length !== scheduledWorkouts.length) {
        console.log(`Removed ${scheduledWorkouts.length - validScheduledWorkouts.length} invalid scheduled workouts`);
        scheduledWorkouts = validScheduledWorkouts;
    }
    
    scheduledWorkouts = scheduledWorkouts.map(scheduled => {
        // 1. Try to find the workout by its workoutId (primary identifier)
        let workout = workouts.find(w => w.id === scheduled.workoutId);
        
        // 2. If not found, try the originalWorkoutId if available
        if (!workout && scheduled.originalWorkoutId) {
            workout = workouts.find(w => w.id === scheduled.originalWorkoutId);
            if (workout) {
                console.log(`Fixed reference using originalWorkoutId: ${scheduled.originalWorkoutId}`);
                scheduled.workoutId = workout.id;
            }
        }
        
        // 3. If not found, try originalFirebaseId if available
        if (!workout && scheduled.originalFirebaseId) {
            workout = workouts.find(w => w.firebaseId === scheduled.originalFirebaseId);
            if (workout) {
                console.log(`Fixed reference using originalFirebaseId: ${scheduled.originalFirebaseId}`);
                scheduled.workoutId = workout.id;
            }
        }
        
        // 4. Last resort: find by title (least reliable but good fallback)
        if (!workout && scheduled.title) {
            workout = workouts.find(w => w.title === scheduled.title);
            if (workout) {
                console.log(`Fixed reference by title: "${scheduled.title}" -> ID: ${workout.id}`);
                scheduled.workoutId = workout.id;
                // Update original IDs for future reference
                scheduled.originalWorkoutId = workout.id;
                scheduled.originalFirebaseId = workout.firebaseId;
            }
        }
        
        if (!workout) {
            console.warn(`Could not find workout for scheduled workout, ID: ${scheduled.workoutId}, title: ${scheduled.title}`);
            // The scheduled workout already contains all needed information for display
        } else {
            // If found, update any information that might have changed in the original workout
            scheduled.title = workout.title;
            scheduled.duration = workout.duration;
            scheduled.difficulty = workout.difficulty;
            scheduled.description = workout.description;
            scheduled.videoUrl = workout.videoUrl;
            scheduled.thumbnailUrl = workout.thumbnailUrl;
        }
        
        return scheduled;
    });
    
    console.log("Scheduled workouts after fixing:", scheduledWorkouts.map(s => ({ id: s.id, workoutId: s.workoutId, title: s.title })));
    renderScheduledWorkouts();
}

// Save scheduled workouts to Firebase and localStorage
async function saveScheduledWorkouts() {
    console.log("Saving scheduled workouts...");
    
    if (useFirebase) {
        try {
            // Save new scheduled workouts to Firebase
            for (const scheduled of scheduledWorkouts) {
                if (!scheduled.firebaseId) {
                    // Only save if it hasn't been saved to Firebase yet
                    const firebaseId = await saveScheduledWorkout(scheduled);
                    scheduled.firebaseId = firebaseId;
                }
            }
            console.log("Scheduled workouts saved to Firebase");
        } catch (error) {
            console.error("Error saving scheduled workouts to Firebase:", error);
        }
    }
    
    // Always save to localStorage as backup, regardless of Firebase status
    console.log("Saving scheduled workouts to localStorage...");
    localStorage.setItem('scheduledWorkouts', JSON.stringify(scheduledWorkouts));
    
    // Log for debugging
    console.log(`Saved ${scheduledWorkouts.length} scheduled workouts to localStorage`);
}

// Load workout logs from Firebase or localStorage
async function loadWorkoutLogs() {
    console.log("Loading workout logs...");
    try {
        const user = auth.currentUser;
        useFirebase = !!user;
        
        if (useFirebase) {
            console.log("User is logged in. Loading workout logs from Firebase...");
            try {
                const logs = await getUserWorkoutLogs();
                // Process logs to ensure workout data is complete
                workoutLogs = logs.map(log => {
                    // If the log has a workout reference, ensure it has video data
                    if (log.workout && log.workout.videoUrl && !log.workout.video) {
                        const videoId = getYoutubeVideoId(log.workout.videoUrl);
                        log.workout.video = {
                            type: 'youtube',
                            url: log.workout.videoUrl,
                            title: log.workout.videoTitle || log.workout.title,
                            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
                        };
                    }
                    // Convert Firebase timestamp to Date object if needed
                    if (log.date && typeof log.date.toDate === 'function') {
                        log.date = log.date.toDate();
                    } else if (typeof log.date === 'string') {
                        log.date = new Date(log.date);
                    }
                    return log;
                });
                console.log(`Loaded ${workoutLogs.length} workout logs from Firebase`);
                console.log("Processed logs:", workoutLogs);
            } catch (error) {
                console.error("Error loading workout logs from Firebase:", error);
                workoutLogs = [];
            }
        } else {
            // User is not logged in, use localStorage
            console.log("User not logged in. Loading workout logs from localStorage...");
            const storedLogs = localStorage.getItem('workoutLogs');
            workoutLogs = storedLogs ? JSON.parse(storedLogs) : [];
            console.log(`Loaded ${workoutLogs.length} workout logs from localStorage`);
        }
    } catch (error) {
        console.error("Error in loadWorkoutLogs:", error);
        workoutLogs = [];
    }
}

// Save workout logs to Firebase and localStorage
async function saveWorkoutLogs() {
    console.log("Saving workout logs...");
    
    if (useFirebase) {
        try {
            // Save new logs to Firebase
            for (const log of workoutLogs) {
                if (!log.firebaseId) {
                    // Only save if it hasn't been saved to Firebase yet
                    const firebaseId = await saveWorkoutLog(log);
                    log.firebaseId = firebaseId;
                }
            }
            console.log("Workout logs saved to Firebase");
        } catch (error) {
            console.error("Error saving workout logs to Firebase:", error);
            throw error; // Re-throw to handle in the calling function
        }
    } else {
        // Save to localStorage only when not using Firebase
        console.log("Saving workout logs to localStorage...");
        localStorage.setItem('workoutLogs', JSON.stringify(workoutLogs));
    }
}

// Render workout cards
function renderWorkoutCards() {
    console.log("Rendering workout cards...");
    
    // If container not found, try to get it again
    if (!workoutCardsContainer) {
        console.error("Workout cards container not found, trying to find it again...");
        workoutCardsContainer = document.getElementById('workoutCardsRef');
        
        // If still not found, try alternative selector
        if (!workoutCardsContainer) {
            console.log("Trying alternative selector for workout cards container");
            workoutCardsContainer = document.querySelector('.workout-cards');
        }
        
        // If we still can't find it, create it
        if (!workoutCardsContainer) {
            console.log("Creating workout cards container as it was not found");
            const cardsContainer = document.querySelector('.workout-cards-container');
            
            if (cardsContainer) {
                workoutCardsContainer = document.createElement('div');
                workoutCardsContainer.id = 'workoutCardsRef';
                workoutCardsContainer.className = 'workout-cards';
                cardsContainer.appendChild(workoutCardsContainer);
                console.log("Created workout cards container");
            } else {
                console.error("Could not find parent container for workout cards");
                return;
            }
        }
    }
    
    // Clear the container
    workoutCardsContainer.innerHTML = '';
    
    // Debug logging
    console.log(`Rendering ${workouts.length} workouts`);
    console.log("Workouts array:", workouts);
    
    // Get today's date in YYYY-MM-DD format for comparison
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Find workouts scheduled for today
    const todaysWorkouts = new Set();
    scheduledWorkouts.forEach(scheduled => {
        // Check if this workout is scheduled for today
        if (scheduled.date === todayString) {
            todaysWorkouts.add(scheduled.workoutId);
        }
        
        // For repeating workouts, check if today is one of the occurrences
        if (scheduled.repeat !== 'never') {
            const originalDate = new Date(`${scheduled.date}T${scheduled.time}`);
            
            // Check if the original date is excluded
            const isOriginalDateExcluded = scheduled.excludeDates && 
                scheduled.excludeDates.some(excludeDate => {
                    const excludeDateObj = new Date(excludeDate);
                    const excludeDateString = excludeDateObj.toISOString().split('T')[0];
                    return excludeDateString === todayString;
                });
            
            if (!isOriginalDateExcluded) {
                // Check if today is a repeating occurrence
                const repeatDates = generateRepeatingDates(
                    originalDate, 
                    scheduled.repeat, 
                    scheduled.customOptions,
                    today, // Only look up to today
                    scheduled.excludeDates || []
                );
                
                // Check if any of the repeat dates are today
                const isTodayOccurrence = repeatDates.some(date => {
                    return date.toISOString().split('T')[0] === todayString;
                });
                
                if (isTodayOccurrence) {
                    todaysWorkouts.add(scheduled.workoutId);
                }
            }
        }
    });
    
    // Check which workouts have any scheduling
    const scheduledWorkoutIds = new Set(scheduledWorkouts.map(sw => sw.workoutId));
    
    // Sort workouts: today's workouts first, then scheduled workouts, then the rest
    const sortedWorkouts = [...workouts].sort((a, b) => {
        const aToday = todaysWorkouts.has(a.id);
        const bToday = todaysWorkouts.has(b.id);
        
        if (aToday && !bToday) return -1;
        if (!aToday && bToday) return 1;
        
        const aScheduled = scheduledWorkoutIds.has(a.id);
        const bScheduled = scheduledWorkoutIds.has(b.id);
        
        if (aScheduled && !bScheduled) return -1;
        if (!aScheduled && bScheduled) return 1;
        
        return 0;
    });
    
    sortedWorkouts.forEach(workout => {
        const card = document.createElement('div');
        card.className = 'workout-card';
        
        // Add special class if this workout is scheduled for today
        if (todaysWorkouts.has(workout.id)) {
            card.classList.add('scheduled-today');
        }
        
        card.dataset.id = workout.id;
        
        let thumbnailHtml = '';
        if (workout.video && workout.video.thumbnail) {
            thumbnailHtml = `
                <div class="workout-thumbnail" style="background-image: url('${workout.video.thumbnail}')">
                    <div class="play-overlay">
                        <span class="material-icons">play_circle</span>
                    </div>
                </div>
            `;
        } else {
            thumbnailHtml = `
                <div class="workout-icon">
                    <span class="material-icons">${workout.icon}</span>
                </div>
            `;
        }
        
        let videoIndicator = '';
        if (workout.video) {
            videoIndicator = `
                <div class="video-indicator">
                    <span class="material-icons">play_circle</span>
                    Video Available
                </div>
            `;
        }
        
        // Add scheduling indicator if this workout is scheduled
        let schedulingIndicator = '';
        if (scheduledWorkoutIds.has(workout.id)) {
            // Find today's scheduled time if applicable
            let scheduledTime = '';
            if (todaysWorkouts.has(workout.id)) {
                // Find the scheduled time for today
                const todaySchedule = scheduledWorkouts.find(s => 
                    s.workoutId === workout.id && s.date === todayString
                );
                
                if (todaySchedule) {
                    // Use the direct schedule time
                    scheduledTime = ` at ${formatTime(todaySchedule.time)}`;
                } else {
                    // Check recurring workouts
                    for (const scheduled of scheduledWorkouts) {
                        if (scheduled.workoutId === workout.id && scheduled.repeat !== 'never') {
                            const originalDate = new Date(`${scheduled.date}T${scheduled.time}`);
                            const repeatDates = generateRepeatingDates(
                                originalDate, 
                                scheduled.repeat, 
                                scheduled.customOptions,
                                today,
                                scheduled.excludeDates || []
                            );
                            
                            // Find today's occurrence
                            const todayOccurrence = repeatDates.find(date => 
                                date.toISOString().split('T')[0] === todayString
                            );
                            
                            if (todayOccurrence) {
                                scheduledTime = ` at ${todayOccurrence.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                break;
                            }
                        }
                    }
                }
            }
            
            schedulingIndicator = `
                <div class="scheduling-indicator ${todaysWorkouts.has(workout.id) ? 'scheduled-today-indicator' : ''}">
                    <span class="material-icons">event</span>
                    ${todaysWorkouts.has(workout.id) ? `Scheduled Today${scheduledTime}` : 'Scheduled'}
                </div>
            `;
        }
        
        card.innerHTML = `
            <button class="favorite-button ${workout.isFavorite ? 'active' : ''}">
                <span class="material-icons">${workout.isFavorite ? 'favorite' : 'favorite_border'}</span>
            </button>
            ${thumbnailHtml}
            <div class="workout-content">
                <h3>${workout.title}</h3>
                <p class="description">${workout.description}</p>
                <div class="workout-meta">
                    <span class="duration"><span class="material-icons">schedule</span> ${workout.duration}</span>
                    <span class="difficulty">${workout.difficulty}</span>
                </div>
                ${videoIndicator}
                ${schedulingIndicator}
                <div class="workout-actions">
                    <button class="start-button">Start</button>
                    <button class="schedule-button">
                        <span class="material-icons">event</span>
                        Schedule
                    </button>
                    <button class="delete-button">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const favoriteBtn = card.querySelector('.favorite-button');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(workout.id);
            });
        }
        
        const startBtn = card.querySelector('.start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                startWorkout(workout.id);
            });
        }
        
        const scheduleBtn = card.querySelector('.schedule-button');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
                showScheduleDialog(workout.id);
            });
        }
        
        const deleteBtn = card.querySelector('.delete-button');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deleteWorkout(workout.id);
            });
        }
        
        if (workout.video) {
            const playOverlay = card.querySelector('.play-overlay');
            if (playOverlay) {
                playOverlay.addEventListener('click', () => {
                    expandWorkout(workout.id);
                });
            }
        }
        
        workoutCardsContainer.appendChild(card);
    });
    
    console.log("Workout cards rendering complete");
}

// Calculate maximum scroll position
function calculateMaxScroll() {
    console.log("Calculating max scroll...");
    if (!workoutCardsContainer) {
        console.error("Workout cards container not found!");
        return;
    }
    
    const containerWidth = workoutCardsContainer.parentElement.clientWidth;
    const totalWidth = workoutCardsContainer.scrollWidth;
    maxScrollPosition = Math.max(0, totalWidth - containerWidth);
    visibleCards = Math.floor(containerWidth / cardWidth);
    
    console.log("Container width:", containerWidth);
    console.log("Total width:", totalWidth);
    console.log("Card width:", cardWidth);
    console.log("Max scroll position:", maxScrollPosition);
    console.log("Visible cards:", visibleCards);
    
    // Update button states
    updateScrollButtons();
}

// Update scroll button states
function updateScrollButtons() {
    if (!scrollLeftBtn || !scrollRightBtn) {
        console.error("Scroll buttons not found!");
        return;
    }
    
    const canScrollLeft = scrollPosition > 0;
    const canScrollRight = scrollPosition < maxScrollPosition;
    
    console.log("Can scroll left:", canScrollLeft);
    console.log("Can scroll right:", canScrollRight);
    
    scrollLeftBtn.classList.toggle('disabled', !canScrollLeft);
    scrollRightBtn.classList.toggle('disabled', !canScrollRight);
    
    // Make sure buttons are visible and clickable
    scrollLeftBtn.style.display = 'flex';
    scrollRightBtn.style.display = 'flex';
    scrollLeftBtn.style.pointerEvents = canScrollLeft ? 'auto' : 'none';
    scrollRightBtn.style.pointerEvents = canScrollRight ? 'auto' : 'none';
}

// Scroll workouts carousel
function scrollWorkouts(direction) {
    console.log(`Scrolling ${direction}...`);
    if (!workoutCardsContainer) {
        console.error("Workout cards container not found!");
        return;
    }
    
    const scrollAmount = cardWidth * (direction === 'left' ? -1 : 1);
    const newPosition = scrollPosition + scrollAmount;
    
    // Add debug logging
    console.log("Current position:", scrollPosition);
    console.log("Scroll amount:", scrollAmount);
    console.log("New position:", newPosition);
    console.log("Max scroll position:", maxScrollPosition);
    
    scrollPosition = Math.max(0, Math.min(newPosition, maxScrollPosition));
    console.log("Final scroll position:", scrollPosition);
    
    workoutCardsContainer.style.transform = `translateX(-${scrollPosition}px)`;
    
    updateScrollButtons();
}

// Toggle favorite - now with Firebase support
async function toggleFavorite(workoutId) {
    console.log(`Toggling favorite for workout ID: ${workoutId}`);
    
    try {
        const index = workouts.findIndex(w => w.id === workoutId);
        if (index === -1) {
            console.error(`Workout with ID ${workoutId} not found!`);
            return false;
        }
        
        // Toggle the favorite status
        workouts[index].isFavorite = !workouts[index].isFavorite;
        
        if (useFirebase) {
            // Update in Firebase
            try {
                await updateWorkout(workoutId, { isFavorite: workouts[index].isFavorite });
            } catch (error) {
                console.error("Error updating workout in Firebase:", error);
                // Continue with local update even if Firebase fails
            }
        }
        
        // Save to localStorage as backup
        saveWorkouts();
        
        // Update UI
        renderWorkoutCards();
        
        return true;
    } catch (error) {
        console.error("Error in toggleFavorite:", error);
        return false;
    }
}

// Set date filter
function setDateFilter(filter) {
    console.log(`Setting date filter: ${filter}`);
    dateFilter = filter;
    
    // Update active button
    if (dateFilterBtns) {
        dateFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
        });
    }
    
    renderWorkoutLog();
}

// Get filtered workout log
function getFilteredWorkoutLog() {
    console.log("Getting filtered workout log...");
    console.log("Current filter:", dateFilter);
    console.log("Total logs:", workoutLogs.length);
    
    if (dateFilter === 'all') {
        return workoutLogs;
    }
    
    const today = new Date();
    let startDate;
    
    if (dateFilter === 'week') {
        // Get date from 7 days ago
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    } else {
        // Get date from 30 days ago
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
    }
    
    const filtered = workoutLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate;
    });
    
    console.log("Filtered logs:", filtered.length);
    return filtered;
}

// Render workout log
function renderWorkoutLog() {
    console.log("Rendering workout log...");
    if (!logEntriesContainer) {
        console.error("Log entries container not found!");
        return;
    }
    
    const filteredLog = getFilteredWorkoutLog();
    console.log("Filtered log entries:", filteredLog);
    
    logEntriesContainer.innerHTML = '';
    
    if (filteredLog.length === 0) {
        logEntriesContainer.innerHTML = '<div class="empty-log">No workouts logged yet. Start a workout to log it!</div>';
        return;
    }
    
    // Sort logs by date (most recent first)
    const sortedLogs = [...filteredLog].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    // Initially show only 5 entries
    const initialEntries = 5;
    const hasMoreEntries = sortedLogs.length > initialEntries;
    
    // Create a function to render entries
    const renderEntries = (entries) => {
        entries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // Ensure we have a valid date
            const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            // Get workout details
            const workoutTitle = entry.workout?.title || 'Unknown Workout';
            const workoutDuration = entry.workout?.duration || 'N/A';
            const workoutTime = date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            logEntry.innerHTML = `
                <div class="entry-date">
                    <div class="date">${formattedDate}</div>
                </div>
                <div class="entry-details">
                    <h3>${workoutTitle}</h3>
                    <div class="entry-stats">
                        <span><span class="material-icons">schedule</span> ${workoutDuration}</span>
                        <span><span class="material-icons">event</span> ${workoutTime}</span>
                    </div>
                </div>
            `;
            
            logEntriesContainer.appendChild(logEntry);
        });
    };
    
    // Render the initial entries
    renderEntries(sortedLogs.slice(0, initialEntries));
    
    // Add "Show More" button if there are more entries
    if (hasMoreEntries) {
        const showMoreContainer = document.createElement('div');
        showMoreContainer.className = 'show-more-container';
        
        const showMoreButton = document.createElement('button');
        showMoreButton.className = 'show-more-button';
        showMoreButton.innerHTML = `
            <span class="material-icons">expand_more</span>
            Show More (${sortedLogs.length - initialEntries} more)
        `;
        
        showMoreButton.addEventListener('click', function() {
            // Remove the show more button
            showMoreContainer.remove();
            
            // Render the remaining entries
            renderEntries(sortedLogs.slice(initialEntries));
            
            // Add a "Show Less" button
            const showLessContainer = document.createElement('div');
            showLessContainer.className = 'show-more-container';
            
            const showLessButton = document.createElement('button');
            showLessButton.className = 'show-more-button';
            showLessButton.innerHTML = `
                <span class="material-icons">expand_less</span>
                Show Less
            `;
            
            showLessButton.addEventListener('click', function() {
                // Re-render the workout log with only the initial entries
                renderWorkoutLog();
            });
            
            showLessContainer.appendChild(showLessButton);
            logEntriesContainer.appendChild(showLessContainer);
        });
        
        showMoreContainer.appendChild(showMoreButton);
        logEntriesContainer.appendChild(showMoreContainer);
    }
    
    console.log("Workout log rendering complete");
}

// Render scheduled workouts
function renderScheduledWorkouts() {
    console.log("Rendering scheduled workouts...");
    
    // If container doesn't exist, skip rendering
    if (!upcomingWorkoutsContainer) {
        console.error("Upcoming workouts container not found!");
        return;
    }
    
    // Clear the container
    upcomingWorkoutsContainer.innerHTML = '';
    
    // Get all occurrences for the upcoming period
    const allOccurrences = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set end date for showing occurrences (e.g., 60 days from now)
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 60);
    
    scheduledWorkouts.forEach(scheduled => {
        // Use stored workout details directly from scheduled workout - no need to look up the original
        const workoutDetails = {
            id: scheduled.workoutId || scheduled.id,
            title: scheduled.title || 'Unknown Workout',
            duration: scheduled.duration || 'Not specified',
            difficulty: scheduled.difficulty || 'Not specified',
            icon: scheduled.icon || 'fitness_center',
            description: scheduled.description || 'No description',
            videoUrl: scheduled.videoUrl,
            thumbnailUrl: scheduled.thumbnailUrl
        };
        
        // Add the original occurrence
        const originalDate = new Date(`${scheduled.date}T${scheduled.time}`);
        
        // Check if the original date is excluded
        const originalDateString = originalDate.toISOString().split('T')[0];
        const isOriginalDateExcluded = scheduled.excludeDates && 
            scheduled.excludeDates.some(excludeDate => {
                // Normalize the date format for comparison
                const excludeDateObj = new Date(excludeDate);
                const excludeDateString = excludeDateObj.toISOString().split('T')[0];
                return excludeDateString === originalDateString;
            });
            
        // Only add if not excluded and is in the future
        if (!isOriginalDateExcluded && originalDate >= today) {
            allOccurrences.push({
                id: scheduled.id,
                date: originalDate,
                workout: workoutDetails,
                isRepeating: scheduled.repeat !== 'never',
                repeatType: scheduled.repeat,
                originalSchedule: scheduled
            });
        }
        
        // Add repeating occurrences
        if (scheduled.repeat && scheduled.repeat !== 'never') {
            const repeatingDates = generateRepeatingDates(
                originalDate, 
                scheduled.repeat, 
                scheduled.customOptions,
                endDate,
                scheduled.excludeDates
            );
            
            repeatingDates.forEach(date => {
                if (date >= today) {
                allOccurrences.push({
                        id: `${scheduled.id}-${date.getTime()}`,
                        date: date,
                        workout: workoutDetails,
                    isRepeating: true,
                    repeatType: scheduled.repeat,
                        originalSchedule: scheduled
                });
                }
            });
        }
    });
    
    // Sort occurrences by date
    allOccurrences.sort((a, b) => a.date - b.date);
    
    // Only show a limited number initially
    const initialLimit = 3;
    const hasMoreWorkouts = allOccurrences.length > initialLimit;
    
    // Display upcoming workouts
    if (allOccurrences.length === 0) {
        upcomingWorkoutsContainer.innerHTML = `
            <div class="no-workouts-message">
                <span class="material-icons">event_busy</span>
                <p>No upcoming workouts scheduled</p>
                <p class="help-text">Add a workout to your schedule by clicking the "Schedule" button on any workout.</p>
            </div>
        `;
    } else {
        // Render the initial batch
        renderOccurrences(allOccurrences.slice(0, initialLimit));
        
        // Add "Show More" button if needed
        if (hasMoreWorkouts) {
            const showMoreContainer = document.createElement('div');
            showMoreContainer.className = 'show-more-container';
            
            const showMoreButton = document.createElement('button');
            showMoreButton.className = 'show-more-button';
            showMoreButton.innerHTML = `
                <span class="material-icons">expand_more</span>
                Show More (${allOccurrences.length - initialLimit} more)
            `;
            
            showMoreButton.addEventListener('click', function() {
                // Remove this button
                showMoreContainer.remove();
                
                // Render all occurrences
                renderOccurrences(allOccurrences.slice(initialLimit));
                
                // Add "Show Less" button
                const showLessContainer = document.createElement('div');
                showLessContainer.className = 'show-more-container';
                
                const showLessButton = document.createElement('button');
                showLessButton.className = 'show-more-button';
                showLessButton.innerHTML = `
                    <span class="material-icons">expand_less</span>
                    Show Less
                `;
                
                showLessButton.addEventListener('click', function() {
                    // Re-render the upcoming workouts with only the initial entries
                    renderScheduledWorkouts();
                });
                
                showLessContainer.appendChild(showLessButton);
                upcomingWorkoutsContainer.appendChild(showLessContainer);
            });
            
            showMoreContainer.appendChild(showMoreButton);
            upcomingWorkoutsContainer.appendChild(showMoreContainer);
        }
    }
    
    console.log("Scheduled workouts rendering complete");
    
    // Function to render a batch of occurrences
    function renderOccurrences(occurrences) {
        occurrences.forEach(occurrence => {
            const card = document.createElement('div');
            card.className = 'upcoming-workout-card';
            
            // Format the date with shortened day names
            const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
            const formattedDate = occurrence.date.toLocaleDateString('en-US', dateOptions);
            const formattedTime = occurrence.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            // Create repeating indicator if needed
            let repeatingIndicator = '';
            if (occurrence.isRepeating) {
                repeatingIndicator = `
                    <div class="repeating-indicator" title="Repeats ${formatRepeatType(occurrence.repeatType)}">
                        <span class="material-icons">repeat</span>
                    </div>
                `;
            }
            
            // Create card content
            card.innerHTML = `
                <div class="upcoming-workout-date">
                    <div class="date">${formattedDate.split(',')[0]}</div>
                    <div class="time">${formattedTime}</div>
                </div>
                <div class="upcoming-workout-content">
                    <h3>${occurrence.workout.title || 'Unknown Workout'}</h3>
                    <div class="upcoming-workout-meta">
                        <span class="duration"><span class="material-icons">schedule</span>${occurrence.workout.duration || 'Not specified'}</span>
                        <span class="difficulty">${occurrence.workout.difficulty || 'Not specified'}</span>
                        ${occurrence.isRepeating ? `<span class="repeat-indicator"><span class="material-icons">repeat</span>${formatRepeatType(occurrence.repeatType)}</span>` : ''}
                    </div>
                </div>
                <div class="upcoming-workout-actions">
                    <button class="start-button" title="Start Workout">
                        <span class="material-icons">play_arrow</span>
                    </button>
                    <button class="reschedule-button" title="Reschedule">
                        <span class="material-icons">event</span>
                    </button>
                    <button class="delete-button" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const rescheduleBtn = card.querySelector('.reschedule-button');
                rescheduleBtn.addEventListener('click', () => {
                    showRescheduleDialog(occurrence);
                });
            
            const deleteBtn = card.querySelector('.delete-button');
            deleteBtn.addEventListener('click', () => {
                showDeleteOptions(occurrence);
            });
            
            const startBtn = card.querySelector('.start-button');
            startBtn.addEventListener('click', () => {
                // Pass both IDs to improve chances of finding the workout
                const workoutToStart = occurrence.workout;
                if (workoutToStart) {
                    startWorkout(workoutToStart.id);
                } else {
                    console.error('No workout data found for this scheduled occurrence');
                    alert('Sorry, the workout data for this scheduled occurrence could not be found.');
                }
            });
            
            upcomingWorkoutsContainer.appendChild(card);
        });
    }
}

// Generate repeating dates based on repeat type
function generateRepeatingDates(startDate, repeatType, customOptions, maxDate, excludeDates = []) {
    console.log("Generating repeating dates:");
    console.log("Start date:", startDate);
    console.log("Repeat type:", repeatType);
    console.log("Max date:", maxDate);
    console.log("Exclude dates:", excludeDates);
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    // Helper function to check if a date is excluded
    const isDateExcluded = (dateToCheck) => {
        // Convert the date to YYYY-MM-DD format for comparison
        const dateStr = dateToCheck.toISOString().split('T')[0];
        
        // Check if this date is in the excludeDates array
        const isExcluded = (excludeDates || []).some(excludeDate => {
            // Handle both string dates and Date objects
            let excludeDateStr;
            if (typeof excludeDate === 'string') {
                // If it's already a string, try to normalize it
                try {
                    const excludeDateObj = new Date(excludeDate);
                    excludeDateStr = excludeDateObj.toISOString().split('T')[0];
                } catch (e) {
                    // If parsing fails, use the original string
                    excludeDateStr = excludeDate;
                }
            } else if (excludeDate instanceof Date) {
                // If it's a Date object, convert to string
                excludeDateStr = excludeDate.toISOString().split('T')[0];
            } else {
                // Unknown format, can't compare
                return false;
            }
            
            // Compare the date strings
            const result = excludeDateStr === dateStr;
            if (result) {
                console.log(`Date ${dateStr} matches excluded date ${excludeDateStr}`);
            }
            return result;
        });
        
        if (isExcluded) {
            console.log(`Date ${dateStr} is excluded`);
        }
        
        return isExcluded;
    };
    
    // Don't include the original date
    switch (repeatType) {
        case 'daily':
            currentDate.setDate(currentDate.getDate() + 1); // Start from next day
            while (currentDate <= maxDate) {
                if (!isDateExcluded(currentDate)) {
                    dates.push(new Date(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            break;
            
        case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7); // Start from next week
            while (currentDate <= maxDate) {
                if (!isDateExcluded(currentDate)) {
                    dates.push(new Date(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + 7);
            }
            break;
            
        case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14); // Start from two weeks later
            while (currentDate <= maxDate) {
                if (!isDateExcluded(currentDate)) {
                    dates.push(new Date(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + 14);
            }
            break;
            
        case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1); // Start from next month
            while (currentDate <= maxDate) {
                if (!isDateExcluded(currentDate)) {
                    dates.push(new Date(currentDate));
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            break;
            
        case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1); // Start from next year
            while (currentDate <= maxDate) {
                if (!isDateExcluded(currentDate)) {
                    dates.push(new Date(currentDate));
                }
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
            break;
            
        case 'custom':
            if (customOptions && customOptions.days && customOptions.days.length > 0) {
                // Custom days of week
                const daysOfWeek = customOptions.days.map(d => parseInt(d));
                currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow
                
                while (currentDate <= maxDate) {
                    if (daysOfWeek.includes(currentDate.getDay()) && !isDateExcluded(currentDate)) {
                        dates.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            break;
    }
    
    console.log(`Generated ${dates.length} repeating dates`);
    return dates;
}

// Format repeat type for display
function formatRepeatType(repeatType) {
    switch (repeatType) {
        case 'daily': return 'Daily';
        case 'weekly': return 'Weekly';
        case 'biweekly': return 'Every 2 Weeks';
        case 'monthly': return 'Monthly';
        case 'yearly': return 'Yearly';
        case 'custom': return 'Custom';
        default: return repeatType;
    }
}

// Toggle calendar visibility
function toggleCalendar() {
    console.log("Toggling calendar visibility");
    if (!calendarContainer) {
        console.error("Calendar container not found!");
        return;
    }
    
    const isVisible = calendarContainer.classList.toggle('visible');
    const toggleBtn = document.getElementById('toggleCalendar');
    
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('.material-icons');
        const text = toggleBtn.textContent.trim().replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
        
        if (isVisible) {
            toggleBtn.innerHTML = `<span class="material-icons">expand_less</span> Hide Calendar`;
            toggleBtn.classList.add('expanded');
            updateCalendarView(); // Update calendar when shown
        } else {
            toggleBtn.innerHTML = `<span class="material-icons">expand_more</span> Show Calendar`;
            toggleBtn.classList.remove('expanded');
            // Make sure to re-render the scheduled workouts when hiding calendar
            renderScheduledWorkouts();
        }
    }
}

// Navigate calendar (prev/next month)
function navigateCalendar(direction) {
    console.log(`Navigating calendar: ${direction > 0 ? 'next' : 'prev'} month`);
    
    // Update current month and year
    currentCalendarMonth += direction;
    
    // Handle year change
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    
    // Update calendar view
    updateCalendarView();
}

// Update calendar view
function updateCalendarView() {
    if (!calendarContainer) {
        console.error("Calendar container not found!");
        return;
    }
    
    // Update month/year display
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${new Date(currentCalendarYear, currentCalendarMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    
    // Generate calendar days
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) {
        console.error("Calendar days container not found!");
        return;
    }
    
    calendarDays.innerHTML = '';
    
    // Get first day of month and total days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    
    // Get previous month's days to display
    const prevMonthDays = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    
    // Generate all occurrences for the calendar
    const allOccurrences = [];
    
    scheduledWorkouts.forEach(scheduled => {
        const workout = workouts.find(w => w.id === scheduled.workoutId);
        if (!workout) return;
        
        // Add the original occurrence
        const originalDate = new Date(`${scheduled.date}T${scheduled.time}`);
        
        // Check if the original date is excluded - convert to YYYY-MM-DD format for comparison
        const originalDateString = originalDate.toISOString().split('T')[0];
        const isOriginalDateExcluded = scheduled.excludeDates && 
            scheduled.excludeDates.some(excludeDate => {
                // Normalize the date format for comparison
                const excludeDateObj = new Date(excludeDate);
                const excludeDateString = excludeDateObj.toISOString().split('T')[0];
                return excludeDateString === originalDateString;
            });
        
        // Only add if not excluded
        if (!isOriginalDateExcluded) {
            allOccurrences.push({
                id: scheduled.id,
                date: originalDate,
                workout: workout,
                isRepeating: scheduled.repeat !== 'never',
                repeatType: scheduled.repeat
            });
        }
        
        // Add repeating occurrences for the current month and adjacent months
        if (scheduled.repeat !== 'never') {
            // Look at 3 months (prev, current, next)
            const startLookDate = new Date(currentCalendarYear, currentCalendarMonth - 1, 1);
            const endLookDate = new Date(currentCalendarYear, currentCalendarMonth + 2, 0);
            
            const repeatDates = generateRepeatingDates(
                originalDate, 
                scheduled.repeat, 
                scheduled.customOptions,
                endLookDate,
                scheduled.excludeDates || []
            );
            
            repeatDates.forEach(repeatDate => {
                if (repeatDate >= startLookDate && repeatDate <= endLookDate) {
                    allOccurrences.push({
                        id: `${scheduled.id}-${repeatDate.getTime()}`,
                        date: repeatDate,
                        workout: workout,
                        isRepeating: true,
                        repeatType: scheduled.repeat
                    });
                }
            });
        }
    });
    
    // Filter out duplicate occurrences (same workout on same date)
    const uniqueOccurrences = [];
    const seenDateTimes = new Map();
    
    allOccurrences.forEach(occurrence => {
        const dateTimeKey = `${occurrence.workout.id}-${occurrence.date.toISOString().split('T')[0]}-${occurrence.date.getHours()}-${occurrence.date.getMinutes()}`;
        
        if (!seenDateTimes.has(dateTimeKey)) {
            uniqueOccurrences.push(occurrence);
            seenDateTimes.set(dateTimeKey, true);
        }
    });
    
    // Create calendar grid
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        const dayNumber = prevMonthDays - i;
        
        const dayDate = new Date(currentCalendarYear, currentCalendarMonth - 1, dayNumber);
        const dayEvents = uniqueOccurrences.filter(o => 
            o.date.getDate() === dayNumber && 
            o.date.getMonth() === currentCalendarMonth - 1 && 
            o.date.getFullYear() === currentCalendarYear
        );
        
        dayElement.innerHTML = `
            <div class="day-number">${dayNumber}</div>
            <div class="day-events">
                ${dayEvents.map(event => `
                    <div class="day-event" title="${event.workout.title}">
                        <span class="material-icons">${event.workout.icon}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        calendarDays.appendChild(dayElement);
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's today
        if (i === today.getDate() && currentCalendarMonth === today.getMonth() && currentCalendarYear === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        const dayDate = new Date(currentCalendarYear, currentCalendarMonth, i);
        const dayEvents = uniqueOccurrences.filter(o => 
            o.date.getDate() === i && 
            o.date.getMonth() === currentCalendarMonth && 
            o.date.getFullYear() === currentCalendarYear
        );
        
        dayElement.innerHTML = `
            <div class="day-number">${i}</div>
            <div class="day-events">
                ${dayEvents.map(event => `
                    <div class="day-event" title="${event.workout.title}">
                        <span class="material-icons">${event.workout.icon}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        calendarDays.appendChild(dayElement);
    }
    
    // Next month days
    const totalDaysDisplayed = firstDay + daysInMonth;
    const remainingCells = 42 - totalDaysDisplayed; // 6 rows of 7 days
    
    for (let i = 1; i <= remainingCells; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        
        const dayDate = new Date(currentCalendarYear, currentCalendarMonth + 1, i);
        const dayEvents = uniqueOccurrences.filter(o => 
            o.date.getDate() === i && 
            o.date.getMonth() === currentCalendarMonth + 1 && 
            o.date.getFullYear() === currentCalendarYear
        );
        
        dayElement.innerHTML = `
            <div class="day-number">${i}</div>
            <div class="day-events">
                ${dayEvents.map(event => `
                    <div class="day-event" title="${event.workout.title}">
                        <span class="material-icons">${event.workout.icon}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        calendarDays.appendChild(dayElement);
    }
}

// Start a workout
function startWorkout(workoutId) {
    console.log(`Starting workout ID: ${workoutId}`);
    
    // First try to find the workout in the workouts array
    let workout = workouts.find(w => w.id === workoutId);
    let isFromScheduled = false;
    
    // If not found, and it's a scheduled workout, try to find by workoutId
    if (!workout && workoutId) {
        // Try to find the scheduled workout
        const scheduled = scheduledWorkouts.find(s => s.firebaseId === workoutId || s.id === workoutId || s.id === parseInt(workoutId));
        
        if (scheduled) {
            console.log(`Found scheduled workout:`, scheduled);
            isFromScheduled = true;
            // If scheduled workout found, get its associated workout
            workout = workouts.find(w => w.id === scheduled.workoutId);
            
            // If still not found, use the stored workout data from scheduled
            if (!workout) {
                console.log(`Original workout not found, using scheduled workout data`);
                workout = {
                    id: scheduled.workoutId || scheduled.id,
                    title: scheduled.title || 'Unknown Workout',
                    duration: scheduled.duration || 'Not specified',
                    difficulty: scheduled.difficulty || 'Not specified',
                    description: scheduled.description || 'No description',
                    videoUrl: scheduled.videoUrl,
                    videoTitle: scheduled.videoTitle || scheduled.title,
                    thumbnailUrl: scheduled.thumbnailUrl
                };
            }
        }
    }
    
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        alert('Sorry, this workout could not be found. It may have been deleted.');
        return;
    }
    
    console.log(`Starting workout: ${workout.title}, Video URL: ${workout.videoUrl}`);
    
    // Expand the workout view
    expandWorkout(workout.id, isFromScheduled ? workout : null);
}

// Log workout completion
async function logWorkoutCompletion(workout) {
    console.log("Logging workout completion...");
    
    const log = {
        workout: workout,
        date: new Date(),
        userId: auth.currentUser?.uid
    };
    
    if (useFirebase) {
        try {
            // Save directly to Firebase
            const firebaseId = await saveWorkoutLog(log);
            log.firebaseId = firebaseId;
            workoutLogs.push(log);
        } catch (error) {
            console.error("Error saving workout log to Firebase:", error);
            throw error;
        }
    } else {
        // Save to local array and localStorage
        workoutLogs.push(log);
        await saveWorkoutLogs();
    }
    
    // Update all relevant UI components
    updateWorkoutStats();
    renderWorkoutLog();
    renderWorkoutCards();
    calculateMaxScroll();
    
    // Show a success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <span class="material-icons">check_circle</span>
        Workout "${workout.title}" completed and logged successfully!
    `;
    document.body.appendChild(successMessage);
    
    // Remove the success message after 3 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

// Show schedule dialog
function showScheduleDialog(workoutId) {
    console.log(`Showing schedule dialog for workout ID: ${workoutId}`);
    
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        return;
    }
    
    // Get the dialog overlay
    const dialogOverlay = document.getElementById('scheduleWorkoutDialog');
    if (!dialogOverlay) {
        console.error("Schedule workout dialog overlay not found!");
        return;
    }
    
    // Update dialog title
    const dialogTitle = dialogOverlay.querySelector('.dialog-title');
    if (dialogTitle) {
        dialogTitle.textContent = `Schedule: ${workout.title}`;
    }
    
    // Store the workout ID for later use
    dialogOverlay.dataset.workoutId = workoutId;
    
    // Set default date and time (tomorrow at current time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInput = document.getElementById('scheduleDate');
    if (dateInput) {
        dateInput.valueAsDate = tomorrow;
    }
    
    const timeInput = document.getElementById('scheduleTime');
    if (timeInput) {
        const hours = String(tomorrow.getHours()).padStart(2, '0');
        const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
    
    // Reset repeat options
    const repeatOption = document.getElementById('repeatOption');
    if (repeatOption) {
        repeatOption.value = 'never';
    }
    
    // Hide custom repeat options
    const customRepeatOptions = document.getElementById('customRepeatOptions');
    if (customRepeatOptions) {
        customRepeatOptions.style.display = 'none';
    }
    
    // Show the dialog
    dialogOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Schedule a workout
async function scheduleWorkout(workoutId, scheduleData) {
    console.log(`Scheduling workout ID: ${workoutId}`);
    console.log("Schedule data:", scheduleData);
    
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        return false;
    }
    
    try {
        // Generate a unique ID for this scheduled workout
        const scheduledId = Date.now();
        
        // Create scheduled workout with ALL necessary workout details for complete independence
        const scheduledWorkout = {
            id: scheduledId,
            workoutId: workoutId, // Keep original ID for reference
            date: scheduleData.date,
            time: scheduleData.time,
            repeat: scheduleData.repeat || 'never',
            customOptions: scheduleData.customOptions || null,
            excludeDates: scheduleData.excludeDates || [],
            
            // Store complete workout details to make it fully self-contained
            title: workout.title || 'Unknown Workout',
            duration: workout.duration || 'Not specified',
            difficulty: workout.difficulty || 'Not specified',
            icon: workout.icon || 'fitness_center',
            description: workout.description || 'No description',
            
            // Include additional workout properties for complete reference
            // Make sure to use null if undefined (for Firebase compatibility)
            videoUrl: workout.videoUrl || null,
            videoTitle: workout.videoTitle || null,
            thumbnailUrl: workout.thumbnailUrl || null,
            
            // Store a copy of both IDs for better matching later
            originalWorkoutId: workout.id,
            originalFirebaseId: workout.firebaseId || null
        };
        
        // If this is a recurring workout, add a seriesId
        if (scheduleData.repeat && scheduleData.repeat !== 'never') {
            scheduledWorkout.seriesId = scheduledId;
        }
        
        // Log for debugging
        console.log("Full scheduled workout data:", JSON.stringify(scheduledWorkout));
        
        // Add to list
        scheduledWorkouts.push(scheduledWorkout);
            
        // Save to Firebase or localStorage
        if (useFirebase) {
            try {
                const firebaseId = await saveScheduledWorkout(scheduledWorkout);
                scheduledWorkout.firebaseId = firebaseId;
            } catch (error) {
                console.error("Error saving scheduled workout to Firebase:", error);
                // Continue without Firebase ID - will be saved to localStorage
            }
        }
        
        // Always save to localStorage as backup
        saveScheduledWorkouts();
        
        // Update the UI
        renderScheduledWorkouts();
        updateCalendarView();
        renderWorkoutCards(); // Add this line to update the workout cards with "Scheduled" indicators
        
        return true;
    } catch (error) {
        console.error("Error scheduling workout:", error);
        return false;
    }
}

// Show delete options dialog
function showDeleteOptions(occurrence) {
    console.log("Showing delete options for:", occurrence);
    
    // Store the current workout ID for reference
    currentScheduleId = occurrence.originalSchedule.id;
    currentWorkoutId = occurrence.id; // Store the specific occurrence ID
    
    // Show or hide the series option based on whether this is a repeating workout
    const deleteSeriesOption = document.getElementById('deleteSeriesWorkout');
    if (deleteSeriesOption) {
        if (occurrence.isRepeating) {
            deleteSeriesOption.style.display = 'flex';
        } else {
            deleteSeriesOption.style.display = 'none';
        }
    }
    
    // Show the dialog
    deleteWorkoutOptionsDialog.style.display = 'flex';
    
    // Set up event listeners
    document.getElementById('deleteSingleWorkout').onclick = function() {
        // Always use handleSingleOccurrenceDeletion for both original and generated occurrences
        // This ensures we're consistently handling single occurrence deletion
        handleSingleOccurrenceDeletion(occurrence);
        deleteWorkoutOptionsDialog.style.display = 'none';
    };
    
    document.getElementById('deleteSeriesWorkout').onclick = function() {
        deleteScheduledWorkout(occurrence.originalSchedule.id, true);
        deleteWorkoutOptionsDialog.style.display = 'none';
    };
    
    document.getElementById('cancelDeleteWorkout').onclick = function() {
        deleteWorkoutOptionsDialog.style.display = 'none';
    };
}

// Handle deletion of a single occurrence from a recurring series
function handleSingleOccurrenceDeletion(occurrence) {
    console.log("Handling single occurrence deletion for:", occurrence);
    console.log("Occurrence ID:", occurrence.id);
    console.log("Occurrence date:", occurrence.date);
    console.log("Is repeating:", occurrence.isRepeating);
    console.log("Original schedule ID:", occurrence.originalSchedule.id);
    console.log("Original schedule repeat:", occurrence.originalSchedule.repeat);
    
    // Find the original scheduled workout
    const scheduledWorkout = scheduledWorkouts.find(s => s.id === occurrence.originalSchedule.id);
    
    if (!scheduledWorkout) {
        console.error("Original scheduled workout not found!");
        return;
    }
    
    // Add this date to the exclude dates array
    if (!scheduledWorkout.excludeDates) {
        scheduledWorkout.excludeDates = [];
    }
    
    // Format the date to match our storage format (YYYY-MM-DD)
    const dateToExclude = occurrence.date.toISOString().split('T')[0];
    
    // Only add if not already in the exclude list
    if (!scheduledWorkout.excludeDates.includes(dateToExclude)) {
        scheduledWorkout.excludeDates.push(dateToExclude);
        console.log(`Added ${dateToExclude} to excluded dates`);
    }
    
    // If using Firebase, update the exclude dates in the database
    if (useFirebase && scheduledWorkout.firebaseId) {
        try {
            console.log(`Updating Firebase with new exclude dates for ID: ${scheduledWorkout.firebaseId}`);
            updateScheduledWorkout(scheduledWorkout.firebaseId, { 
                excludeDates: scheduledWorkout.excludeDates
            }).then(() => {
                console.log("Firebase updated with new exclude dates");
            }).catch(error => {
                console.error("Error updating exclude dates in Firebase:", error);
            });
        } catch (error) {
            console.error("Error preparing Firebase update:", error);
        }
    }
    
    // Save to localStorage
    saveScheduledWorkouts();
    
    // Update the UI
    renderScheduledWorkouts();
    updateCalendarView();
    renderWorkoutCards(); // Add this line to update the "Scheduled" indicators
    
    console.log("Single occurrence deleted successfully");
}

// Delete a scheduled workout
async function deleteScheduledWorkout(scheduledId, deleteEntireSeries = false) {
    console.log(`Deleting scheduled workout ID: ${scheduledId}, Delete entire series: ${deleteEntireSeries}`);
    
    try {
        // Find the workout to delete (by id or firebaseId)
        const workout = scheduledWorkouts.find(s => 
            s.id === scheduledId || 
            s.firebaseId === scheduledId ||
            (typeof scheduledId === 'string' && s.id === parseInt(scheduledId))
        );
        
        if (!workout) {
            console.error(`Scheduled workout with ID ${scheduledId} not found!`);
            return;
        }
        
        console.log("Found workout to delete:", workout);
        
        if (deleteEntireSeries) {
            // SERIES DELETION
            if (workout.seriesId) {
                console.log(`Deleting entire series with seriesId ${workout.seriesId}`);
                
                // Find all workouts in this series
                const workoutsToDelete = scheduledWorkouts.filter(s => s.seriesId === workout.seriesId);
                console.log(`Found ${workoutsToDelete.length} workouts in this series to delete`);
                
                // If using Firebase, delete each workout individually from Firebase
                if (useFirebase) {
                    console.log(`Deleting series from Firebase...`);
                    let deletionPromises = [];
                    
                    for (const workoutToDelete of workoutsToDelete) {
                        if (workoutToDelete.firebaseId) {
                            console.log(`Deleting workout with Firebase ID: ${workoutToDelete.firebaseId}`);
                            // Add each deletion to a Promise array for parallel execution
                            const promise = deleteScheduledWorkoutFromFirebase(workoutToDelete.firebaseId)
                                .then(() => console.log(`Successfully deleted workout ${workoutToDelete.firebaseId} from Firebase`))
                                .catch(error => console.error(`Error deleting workout ${workoutToDelete.firebaseId} from Firebase:`, error));
                            
                            deletionPromises.push(promise);
                        } else {
                            console.log(`Workout in series has no Firebase ID, skipping Firebase deletion`);
                        }
                    }
                    
                    // Wait for all deletions to complete
                    await Promise.all(deletionPromises);
                    console.log("All Firebase deletions completed");
                }
                
                // Remove all workouts with the seriesId from our local array
                const beforeCount = scheduledWorkouts.length;
                scheduledWorkouts = scheduledWorkouts.filter(s => s.seriesId !== workout.seriesId);
                const afterCount = scheduledWorkouts.length;
                console.log(`Removed ${beforeCount - afterCount} workouts from local array`);
            } else {
                // No seriesId, just delete this specific workout
                console.log(`Workout has no seriesId, deleting single workout`);
                
                // If using Firebase, delete from server
                if (useFirebase && workout.firebaseId) {
                    try {
                        console.log(`Deleting single workout with Firebase ID: ${workout.firebaseId}`);
                        await deleteScheduledWorkoutFromFirebase(workout.firebaseId);
                        console.log(`Successfully deleted workout from Firebase`);
                    } catch (error) {
                        console.error(`Error deleting scheduled workout from Firebase:`, error);
                    }
                }
                
                // Remove from local array
                const index = scheduledWorkouts.findIndex(s => 
                    s.id === scheduledId || 
                    s.firebaseId === scheduledId ||
                    (typeof scheduledId === 'string' && s.id === parseInt(scheduledId))
                );
                
                if (index !== -1) {
                    scheduledWorkouts.splice(index, 1);
                    console.log(`Removed workout from local array`);
                }
            }
            
            console.log("Series deletion completed successfully");
        } else {
            // SINGLE OCCURRENCE DELETION
            // Check if this is part of a series
            if (workout.repeat !== 'never' && workout.seriesId) {
                console.error("Attempted to delete a single occurrence of a recurring workout directly. Use handleSingleOccurrenceDeletion instead.");
                return;
            }
            
            // If using Firebase, delete from server
            if (useFirebase && workout.firebaseId) {
                try {
                    console.log(`Deleting single workout with Firebase ID: ${workout.firebaseId}`);
                    await deleteScheduledWorkoutFromFirebase(workout.firebaseId);
                    console.log(`Successfully deleted workout from Firebase`);
                } catch (error) {
                    console.error(`Error deleting scheduled workout from Firebase:`, error);
                }
            }
            
            // Remove from local array
            const index = scheduledWorkouts.findIndex(s => 
                s.id === scheduledId || 
                s.firebaseId === scheduledId ||
                (typeof scheduledId === 'string' && s.id === parseInt(scheduledId))
            );
            
            if (index !== -1) {
                scheduledWorkouts.splice(index, 1);
                console.log(`Removed workout from local array`);
            }
            
            console.log("Single scheduled workout deleted successfully");
        }
        
        // Save changes to localStorage
        await saveScheduledWorkouts();
        
        // Force a reload of scheduled workouts from Firebase
        if (useFirebase) {
            console.log("Reloading scheduled workouts from Firebase after deletion");
            await loadScheduledWorkouts();
        }
        
        // Update UI
        renderScheduledWorkouts();
        updateCalendarView();
        renderWorkoutCards(); // Add this line to update the workout cards
        
    } catch (error) {
        console.error("Error deleting scheduled workout:", error);
        // Force reload to ensure we're in sync with Firebase
        await loadScheduledWorkouts();
        renderScheduledWorkouts();
        updateCalendarView();
        renderWorkoutCards(); // Add this line to update the workout cards even after errors
    }
}

// Show reschedule dialog
function showRescheduleDialog(occurrence) {
    console.log("Showing reschedule dialog for:", occurrence);
    
    // Store the current workout for reference
    currentScheduleId = occurrence.originalSchedule.id;
    currentWorkoutId = occurrence.id; // Store the specific occurrence ID
    
    // Set initial values in the form
    const dateInput = document.getElementById('rescheduleDate');
    const timeInput = document.getElementById('rescheduleTime');
    const adjustSeriesToggle = document.getElementById('adjustSeriesToggle');
    
    // Format date for input (YYYY-MM-DD)
    const dateStr = occurrence.date.toISOString().split('T')[0];
    dateInput.value = dateStr;
    
    // Format time for input (HH:MM)
    const hours = occurrence.date.getHours().toString().padStart(2, '0');
    const minutes = occurrence.date.getMinutes().toString().padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
    
    // Show or hide the adjust series toggle based on whether this is a repeating workout
    if (occurrence.isRepeating) {
        adjustSeriesToggle.parentElement.parentElement.style.display = 'block';
        adjustSeriesToggle.checked = false; // Default to NOT adjusting the series
    } else {
        adjustSeriesToggle.parentElement.parentElement.style.display = 'none';
    }
    
    // Show the dialog
    rescheduleWorkoutDialog.style.display = 'flex';
}

// Reschedule a workout
function rescheduleWorkout(workoutId, oldDateTime, newDateTime, adjustSeries = false) {
    console.log(`Rescheduling workout ID: ${workoutId}`);
    console.log("Old date/time:", oldDateTime);
    console.log("New date/time:", newDateTime);
    console.log("Adjust series:", adjustSeries);
    
    // Find the workout
    const workoutIndex = scheduledWorkouts.findIndex(s => s.id === workoutId);
    if (workoutIndex === -1) {
        console.error(`Scheduled workout with ID ${workoutId} not found!`);
        return false;
    }
    
    const workout = scheduledWorkouts[workoutIndex];
    
    // Calculate the time difference in milliseconds
    const timeDifference = newDateTime.getTime() - oldDateTime.getTime();
    
    if (adjustSeries && (workout.repeat !== 'never')) {
        // Get all workouts in the series
        const seriesId = workout.seriesId || workout.id;
        
        // Update all workouts in the series that occur after the selected one
        scheduledWorkouts.forEach(s => {
            const sSeriesId = s.seriesId || s.id;
            
            // Check if this workout is part of the same series
            if (sSeriesId === seriesId) {
                // Get the date of this occurrence
                const occurrenceDate = new Date(`${s.date}T${s.time}`);
                
                // Only adjust if this occurrence is on or after the one being rescheduled
                if (occurrenceDate >= oldDateTime) {
                    // Apply the same time difference
                    const newOccurrenceDate = new Date(occurrenceDate.getTime() + timeDifference);
                    
                    // Update the date and time
                    s.date = newOccurrenceDate.toISOString().split('T')[0];
                    s.time = newOccurrenceDate.toTimeString().split(' ')[0].substring(0, 5);
                }
            }
        });
    } else if (workout.repeat !== 'never') {
        // This is a recurring workout, but we're only rescheduling this occurrence
        // We need to:
        // 1. Add the original date to the exclusion list
        // 2. Create a new one-time occurrence for the new date/time
        
        // Initialize excludeDates array if it doesn't exist
        if (!workout.excludeDates) {
            workout.excludeDates = [];
        }
        
        // Add the original date to the exclusion list
        const originalDateString = oldDateTime.toISOString().split('T')[0];
        if (!workout.excludeDates.includes(originalDateString)) {
            workout.excludeDates.push(originalDateString);
            console.log(`Added original date ${originalDateString} to exclusion list`);
        }
        
        // Create a new one-time occurrence for the new date/time
        const newDate = newDateTime.toISOString().split('T')[0];
        const newTime = newDateTime.toTimeString().split(' ')[0].substring(0, 5);
        
        // Check if there's already a workout at the same date and time
        const targetDateTimeStr = `${newDate}T${newTime}`;
        const targetDateTime = new Date(targetDateTimeStr);
        
        // Look for any existing workouts on the same date with the same workout ID
        const existingWorkoutIndex = scheduledWorkouts.findIndex(s => 
            s.date === newDate && 
            s.workoutId === workout.workoutId &&
            Math.abs(new Date(`${s.date}T${s.time}`).getHours() - targetDateTime.getHours()) < 1 &&
            // Don't consider the original workout we're rescheduling
            s.id !== workout.id
        );
        
        if (existingWorkoutIndex !== -1) {
            // We found a duplicate - ask if the user wants to replace it
            if (confirm(`There is already a workout scheduled on ${newDate} at ${scheduledWorkouts[existingWorkoutIndex].time}. Do you want to replace it?`)) {
                // Remove the existing workout
                scheduledWorkouts.splice(existingWorkoutIndex, 1);
                
                // Now create the new one
                createRescheduledOccurrence();
            } else {
                // User chose not to replace, so don't do anything
                console.log("User chose not to replace existing workout");
                return false;
            }
        } else {
            // No duplicate, create the new occurrence
            createRescheduledOccurrence();
        }
        
        // Helper function to create a rescheduled occurrence
        function createRescheduledOccurrence() {
            // Generate a unique ID for this scheduled workout
            const scheduledId = Date.now();
            
            // Create a new scheduled workout for this single occurrence
            const newScheduledWorkout = {
                id: scheduledId,
                workoutId: workout.workoutId,
                date: newDate,
                time: newTime,
                repeat: 'never', // This is a one-time occurrence
                customOptions: null,
                excludeDates: [],
                // Preserve the original series ID and add a flag to indicate this is a rescheduled occurrence
                seriesId: workout.seriesId || workout.id,
                isRescheduled: true,
                originalRepeatType: workout.repeat // Store the original repeat type for display purposes
            };
            
            // Add to list
            scheduledWorkouts.push(newScheduledWorkout);
            console.log("Created new one-time occurrence:", newScheduledWorkout);
        }
    } else {
        // Just update the single occurrence
        const newDate = newDateTime.toISOString().split('T')[0];
        const newTime = newDateTime.toTimeString().split(' ')[0].substring(0, 5);
        
        workout.date = newDate;
        workout.time = newTime;
    }
    
    // Save changes
    saveScheduledWorkouts();
    
    // Update UI
    renderScheduledWorkouts();
    renderWorkoutCards();
    
    console.log("Workout rescheduled successfully");
    return true;
}

// Add a workout - now with Firebase support
async function addWorkout(workoutData) {
    console.log("Adding workout:", workoutData);
    
    try {
        // Create workout object
        let workout = {
            title: workoutData.title,
            description: workoutData.description || "No description provided",
            duration: workoutData.duration || "Not specified",
            difficulty: workoutData.difficulty || "Not specified",
            icon: workoutData.icon || 'fitness_center',
            isFavorite: false
        };
        
        // Add video information if provided
        if (workoutData.videoUrl) {
            const videoId = getYoutubeVideoId(workoutData.videoUrl);
            if (videoId) {
                workout.video = {
                    type: 'youtube',
                    url: workoutData.videoUrl,
                    title: workoutData.videoTitle || workoutData.title,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                };
            }
        }
        
        if (useFirebase) {
            // Save to Firebase and get the ID
            try {
                const firestoreId = await saveWorkout(workout);
                workout.id = firestoreId;
                
                // Add to local array
                workouts.push(workout);
            } catch (error) {
                console.error("Error saving workout to Firebase:", error);
                
                // Fallback to localStorage
                workout.id = Date.now();
                workouts.push(workout);
                saveWorkouts();
            }
        } else {
            // Not using Firebase, use local storage
            workout.id = Date.now();
            workouts.push(workout);
            saveWorkouts();
        }
        
        // Update all relevant UI components
        renderWorkoutCards();
        calculateMaxScroll();
        updateWorkoutStats();
        renderScheduledWorkouts();
        updateCalendarView();
        
        // Show a success message
        const successMessage = document.createElement('div');
        calculateMaxScroll();
        
        return true;
    } catch (error) {
        console.error("Error in deleteWorkout:", error);
        return false;
    }
}

// Expand workout view
function expandWorkout(workoutId, workoutData = null) {
    console.log(`Expanding workout ID: ${workoutId}`);
    
    // If workout data is directly provided, use it
    let workout = workoutData;
    
    // Otherwise, find the workout by ID
    if (!workout) {
        workout = workouts.find(w => w.id === workoutId);
        if (!workout) {
            console.error(`Cannot expand workout: ID ${workoutId} not found`);
            return;
        }
    }
    
    // Store the selected workout
    selectedWorkout = workout;
    
    // Update the expanded workout view
    if (!expandedWorkoutOverlay || !expandedWorkoutContainer) {
        console.error("Expanded workout elements not found");
        return;
    }
    
    // Set current workout ID
    currentWorkoutId = workoutId;
    
    // Get the video URL
    let videoHtml = '';
    if (workout.videoUrl) {
        console.log(`Loading video from URL: ${workout.videoUrl}`);
        const embedUrl = getYoutubeEmbedUrl(workout.videoUrl);
        
        if (embedUrl) {
            videoHtml = `
                <div class="video-player">
                    <iframe 
                        id="youtubePlayer"
                        src="${embedUrl}" 
                        title="${workout.title}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        } else {
            // If not a YouTube URL, try direct video
            videoHtml = `
                <div class="video-player">
                    <video id="videoPlayer" controls>
                        <source src="${workout.videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        }
    } else {
        videoHtml = `
            <div class="no-video">
                <span class="material-icons">videocam_off</span>
                <p>No video available for this workout.</p>
            </div>
        `;
    }
    
    // Update the expanded workout content
    expandedWorkoutContainer.innerHTML = `
        <button class="close-expanded" id="closeExpandedWorkout">
            <span class="material-icons">close</span>
        </button>
        <button class="favorite-button expanded-favorite" id="toggleExpandedFavorite">
            <span class="material-icons">${workout.isFavorite ? 'favorite' : 'favorite_border'}</span>
        </button>
        ${videoHtml}
        <div class="expanded-details">
            <div class="expanded-header">
                <h2>${workout.title}</h2>
                <button class="finish-workout-button" id="finishWorkout">
                    <span class="material-icons">check_circle</span>
                    Finish Workout
                </button>
            </div>
            <p>${workout.description || 'No description available.'}</p>
            <div class="workout-meta">
                <span class="duration"><span class="material-icons">schedule</span> ${workout.duration || 'Not specified'}</span>
                <span class="difficulty">${workout.difficulty || 'Not specified'}</span>
            </div>
        </div>
    `;
    
    // Add event listeners
    const closeBtn = document.getElementById('closeExpandedWorkout');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeExpandedWorkout);
    } else {
        console.error("Close expanded workout button not found!");
    }
    
    const favoriteBtn = document.getElementById('toggleExpandedFavorite');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            toggleFavorite(workout.id);
            favoriteBtn.querySelector('.material-icons').textContent = 
                workout.isFavorite ? 'favorite' : 'favorite_border';
        });
    } else {
        console.error("Toggle expanded favorite button not found!");
    }
    
    const finishBtn = document.getElementById('finishWorkout');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            logWorkoutCompletion(workout);
            closeExpandedWorkout();
        });
    } else {
        console.error("Finish workout button not found!");
    }
    
    // Show the overlay
    expandedWorkoutOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close expanded workout view
function closeExpandedWorkout() {
    console.log("Closing expanded workout view");
    if (!expandedWorkoutOverlay) {
        console.error("Expanded workout overlay not found!");
        return;
    }
    
    // Stop any playing videos
    const youtubePlayer = document.getElementById('youtubePlayer');
    if (youtubePlayer) {
        // For YouTube iframes, we need to set the src to empty to stop playback
        const currentSrc = youtubePlayer.src;
        youtubePlayer.src = '';
        // Optional: restore the src without autoplay if you want to keep the video loaded but paused
        // youtubePlayer.src = currentSrc.replace('&autoplay=1', '');
    }
    
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
    
    expandedWorkoutOverlay.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    selectedWorkout = null;
}

// Format time string (HH:MM) to a more readable format
function formatTime(timeString) {
    try {
        // Parse HH:MM format
        const [hours, minutes] = timeString.split(':').map(Number);
        
        // Create a date to use JavaScript's formatting
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
        console.error("Error formatting time:", e);
        return timeString;
    }
}

// Get YouTube video ID from URL
function getYoutubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Get YouTube embed URL
function getYoutubeEmbedUrl(url) {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&vq=hd1080` : '';
}

// Initialize the app
async function initApp() {
    console.log("Initializing app...");
    
    // Initialize DOM elements
    initDOMElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Listen for authentication state changes
    auth.onAuthStateChanged(async (user) => {
        console.log(user ? `User logged in: ${user.uid}` : "User logged out");
        
        // Update UI based on user
        updateUserDisplay(user);
        
        try {
            // First load regular workouts
            await loadWorkouts();
            console.log(`Loaded ${workouts.length} workouts`);
            
            // Small delay to ensure workouts are fully loaded
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Then load scheduled workouts (which need the workouts to be loaded first)
            await loadScheduledWorkouts();
            console.log(`Loaded ${scheduledWorkouts.length} scheduled workouts`);
            
            // Load workout logs
            await loadWorkoutLogs();
            console.log(`Loaded ${workoutLogs.length} workout logs`);
            
            // Render the UI
            renderWorkoutCards();
            calculateMaxScroll();
            renderWorkoutLog();
            updateWorkoutStats();
            renderScheduledWorkouts();
            updateCalendarView();
        } catch (error) {
            console.error("Error loading data during auth state change:", error);
            // Still try to render UI with whatever data we have
            renderWorkoutCards();
            calculateMaxScroll();
            renderWorkoutLog();
            updateWorkoutStats();
            renderScheduledWorkouts();
            updateCalendarView();
        }
    });
    
    // Initial data load for non-authenticated users
    if (!auth.currentUser) {
        try {
            await loadWorkouts();
            await loadScheduledWorkouts();
            await loadWorkoutLogs();
            renderWorkoutCards();
            calculateMaxScroll();
            renderWorkoutLog();
            updateWorkoutStats();
            renderScheduledWorkouts();
        } catch (error) {
            console.error("Error during initial data load:", error);
        }
    }
    
    console.log("App initialization complete");
}

// Set up event listeners for the UI
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Add event listeners for scroll buttons if they exist
    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => scrollWorkouts(-1));
    }
    
    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => scrollWorkouts(1));
    }
    
    // Add event listeners for date filter buttons
    if (dateFilterBtns) {
        dateFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                dateFilterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Set filter
                setDateFilter(btn.dataset.filter);
            });
        });
    }
    
    // Add event listeners for schedule workout dialog
    const cancelScheduleBtn = document.getElementById('cancelSchedule');
    const confirmScheduleBtn = document.getElementById('confirmSchedule');
    const repeatOptionSelect = document.getElementById('repeatOption');
    const customRepeatOptions = document.getElementById('customRepeatOptions');
    
    if (cancelScheduleBtn) {
        cancelScheduleBtn.addEventListener('click', () => {
            scheduleWorkoutDialog.style.display = 'none';
            document.body.style.overflow = 'auto'; // Enable scrolling
        });
    }
    
    if (confirmScheduleBtn) {
        confirmScheduleBtn.addEventListener('click', () => {
            const workoutId = scheduleWorkoutDialog.dataset.workoutId;
            const dateInput = document.getElementById('scheduleDate');
            const timeInput = document.getElementById('scheduleTime');
            const repeatOption = document.getElementById('repeatOption');
            
            if (!dateInput || !timeInput || !repeatOption) {
                console.error("Schedule form elements not found!");
                return;
            }
            
            if (!dateInput.value || !timeInput.value) {
                console.error("Date and time are required!");
                alert("Please enter a date and time for this workout.");
                return;
            }
            
            // Get any custom repeat options
            let customOptions = null;
            if (repeatOption.value !== 'never' && customRepeatOptions.style.display !== 'none') {
                // TODO: Get any custom options based on repeat type
            }
            
            // Create schedule data
            const scheduleData = {
                date: dateInput.value,
                time: timeInput.value,
                repeat: repeatOption.value,
                customOptions,
                excludeDates: []
            };
            
            // Schedule the workout
            scheduleWorkout(workoutId, scheduleData).then(success => {
                if (success) {
                    // Hide the dialog
                    scheduleWorkoutDialog.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Enable scrolling
                } else {
                    alert("Failed to schedule workout. Please try again.");
                }
            });
        });
    }
    
    // Set up repeat option change handler
    if (repeatOptionSelect) {
        repeatOptionSelect.addEventListener('change', () => {
            const repeatValue = repeatOptionSelect.value;
            
            // Show/hide custom options based on selection
            if (repeatValue === 'never') {
                customRepeatOptions.style.display = 'none';
            } else {
                customRepeatOptions.style.display = 'block';
                
                // Set appropriate custom repeat options
                if (repeatValue === 'daily') {
                    customRepeatOptions.innerHTML = `
                        <label>Repeat every</label>
                        <div class="inline-input">
                            <input type="number" id="dailyInterval" min="1" value="1">
                            <span>day(s)</span>
                        </div>
                    `;
                } else if (repeatValue === 'weekly') {
                    customRepeatOptions.innerHTML = `
                        <label>Repeat every</label>
                        <div class="inline-input">
                            <input type="number" id="weeklyInterval" min="1" value="1">
                            <span>week(s)</span>
                        </div>
                        <div class="weekday-selector">
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-0" value="0">
                                <label for="weekday-0">S</label>
                            </div>
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-1" value="1">
                                <label for="weekday-1">M</label>
                            </div>
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-2" value="2">
                                <label for="weekday-2">T</label>
                            </div>
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-3" value="3">
                                <label for="weekday-3">W</label>
                            </div>
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-4" value="4">
                                <label for="weekday-4">T</label>
                            </div>
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-5" value="5">
                                <label for="weekday-5">F</label>
                            </div>
                            <div class="weekday-toggle">
                                <input type="checkbox" id="weekday-6" value="6">
                                <label for="weekday-6">S</label>
                            </div>
                        </div>
                    `;
                    
                    // Check the day of the selected date
                    const dateInput = document.getElementById('scheduleDate');
                    if (dateInput && dateInput.value) {
                        const selectedDate = new Date(dateInput.value);
                        const dayOfWeek = selectedDate.getDay();
                        const dayCheckbox = document.getElementById(`weekday-${dayOfWeek}`);
                        if (dayCheckbox) {
                            dayCheckbox.checked = true;
                        }
                    }
                } else if (repeatValue === 'monthly') {
                    customRepeatOptions.innerHTML = `
                        <label>Repeat every</label>
                        <div class="inline-input">
                            <input type="number" id="monthlyInterval" min="1" value="1">
                            <span>month(s)</span>
                        </div>
                        <div class="repeat-option">
                            <input type="radio" id="monthlyByDay" name="monthlyType" value="byDay" checked>
                            <label for="monthlyByDay">On the same day of the month</label>
                        </div>
                        <div class="repeat-option">
                            <input type="radio" id="monthlyByWeekday" name="monthlyType" value="byWeekday">
                            <label for="monthlyByWeekday">On the same weekday of the month</label>
                        </div>
                    `;
                }
            }
        });
    }
    
    console.log("Event listeners setup complete");
}

// Call initApp when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, initializing app");
    
    // Delay app initialization slightly to ensure all scripts are loaded
    setTimeout(initApp, 100);
    
    // Set up debugging listeners
    document.addEventListener('workoutAdded', () => {
        console.log("Workout added event detected in main.js");
    });
});

// Expose functions to global scope
window.addWorkout = addWorkout;
window.deleteWorkout = deleteWorkout;
window.toggleFavorite = toggleFavorite;
window.startWorkout = startWorkout;
window.scheduleWorkout = scheduleWorkout;
window.showScheduleDialog = showScheduleDialog;
window.deleteScheduledWorkout = deleteScheduledWorkout;
window.expandWorkout = expandWorkout;
window.renderWorkoutCards = renderWorkoutCards;
window.calculateMaxScroll = calculateMaxScroll;
window.renderScheduledWorkouts = renderScheduledWorkouts;
window.workouts = workouts;

console.log("App initialization complete"); 

// Helper function to process Firebase timestamp or date object
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    // Handle Firebase Timestamp object
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    }
    
    // Handle Date object
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    
    // Handle string date
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    
    // Handle seconds + nanoseconds format from Firestore
    if (timestamp.seconds && timestamp.nanoseconds) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toISOString();
    }
    
    return '';
}

// Process a workout from Firestore to ensure it has the correct format
function processFirestoreWorkout(workout) {
    if (!workout) return null;
    
    // Create a copy to avoid modifying the original
    const processed = { ...workout };
    
    // Handle timestamps
    if (processed.createdAt) {
        processed.createdAt = formatTimestamp(processed.createdAt);
    }
    
    if (processed.updatedAt) {
        processed.updatedAt = formatTimestamp(processed.updatedAt);
    }
    
    // Fix missing video object structure if videoUrl exists but video object doesn't
    if (processed.videoUrl && !processed.video) {
        const videoId = getYoutubeVideoId(processed.videoUrl);
        processed.video = {
            type: 'youtube',
            url: processed.videoUrl,
            title: processed.videoTitle || processed.title,
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
        };
    }
    
    // Ensure all required fields have values
    return {
        id: processed.id,
        title: processed.title || 'Untitled Workout',
        description: processed.description || '',
        duration: processed.duration || '',
        difficulty: processed.difficulty || '',
        icon: processed.icon || 'fitness_center',
        isFavorite: !!processed.isFavorite,
        videoUrl: processed.videoUrl || '',
        videoTitle: processed.videoTitle || '',
        video: processed.video || null,
        // Keep any other fields that might be present
        ...processed
    };
}

// Clear local data on logout
function clearLocalData() {
    console.log("Clearing local data...");
    workouts = [];
    workoutLogs = [];
    localStorage.removeItem('workouts');
    localStorage.removeItem('workoutLogs');
}

// Update workout stats
function updateWorkoutStats() {
    // Implement any additional logic you want to execute when workout stats are updated
    console.log("Workout stats updated");
}

// Delete a workout
async function deleteWorkout(workoutId) {
    console.log(`Deleting workout ID: ${workoutId}`);
    
    try {
        // Find the workout
        const workout = workouts.find(w => w.id === workoutId);
        if (!workout) {
            console.error(`Workout with ID ${workoutId} not found!`);
            return false;
        }
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${workout.title}"?`)) {
            return false;
        }
        
        // If using Firebase, delete from the database
        if (useFirebase) {
            try {
                await deleteWorkoutFromFirebase(workoutId);
                console.log(`Workout deleted from Firebase: ${workoutId}`);
            } catch (error) {
                console.error(`Error deleting workout from Firebase:`, error);
                return false;
            }
        }
        
        // Remove from our local array
        workouts = workouts.filter(w => w.id !== workoutId);
        
        // Save changes to localStorage
        saveWorkouts();
        
        // Update UI
        renderWorkoutCards();
        calculateMaxScroll();
        updateWorkoutStats();
        
        console.log(`Workout deleted successfully: ${workoutId}`);
        return true;
    } catch (error) {
        console.error("Error deleting workout:", error);
        return false;
    }
}

// Update user display based on authentication status
function updateUserDisplay(user) {
    // Show appropriate notification
    const infoFooter = document.querySelector('.info-banner');
    if (infoFooter) {
        if (user) {
            infoFooter.innerHTML = `
                <span class="material-icons">cloud_done</span>
                <p>You are logged in as <strong>${user.email}</strong>. Your workouts are being saved to the cloud and can be accessed from any device.</p>
            `;
            infoFooter.style.backgroundColor = '#4CAF50';
        } else {
            infoFooter.innerHTML = `
                <span class="material-icons">info</span>
                <p>Currently your workouts are saved locally on this browser only. <strong>Log in or create an account</strong> to save your workouts to the cloud and access them from any device.</p>
            `;
            infoFooter.style.backgroundColor = '';
        }
    }
    
    // Update login/logout button if it exists
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    
    if (loginButton) {
        loginButton.style.display = user ? 'none' : 'block';
    }
    
    if (logoutButton) {
        logoutButton.style.display = user ? 'block' : 'none';
    }
    
    // Update user display area if it exists
    const userDisplayArea = document.getElementById('userDisplay');
    if (userDisplayArea) {
        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            userDisplayArea.innerHTML = `
                <span class="user-avatar">
                    <span class="material-icons">account_circle</span>
                </span>
                <span class="user-name">${displayName}</span>
            `;
            userDisplayArea.style.display = 'flex';
        } else {
            userDisplayArea.style.display = 'none';
        }
    }
}