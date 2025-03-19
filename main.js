// Global variables
let workouts = [];
let scheduledWorkouts = [];
let workoutLogs = [];
let selectedWorkout = null;
let currentWorkoutId = null;
let currentScheduleId = null; // For tracking which workout is being deleted or rescheduled

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

// Load workouts from localStorage
function loadWorkouts() {
    console.log("Loading workouts from localStorage...");
    try {
        const storedWorkouts = localStorage.getItem('workouts');
        workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
        
        // Add one default workout if none exist
        if (workouts.length === 0) {
            workouts = [
                {
                    id: 1,
                    title: "HIIT Cardio Workout",
                    description: "High-intensity interval training to boost your cardio fitness and burn calories.",
                    duration: "30 min",
                    difficulty: "Intermediate",
                    icon: "local_fire_department",
                    isFavorite: false,
                    video: {
                        type: "youtube",
                        url: "https://www.youtube.com/watch?v=ml6cT4AZdqI",
                        title: "30-Minute HIIT Cardio Workout",
                        thumbnail: "https://img.youtube.com/vi/ml6cT4AZdqI/hqdefault.jpg"
                    }
                }
            ];
            saveWorkouts();
        }
        
        console.log(`Loaded ${workouts.length} workouts`);
    } catch (error) {
        console.error("Error loading workouts:", error);
        workouts = [];
    }
}

// Save workouts to localStorage
function saveWorkouts() {
    console.log("Saving workouts to localStorage...");
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

// Load scheduled workouts from localStorage
function loadScheduledWorkouts() {
    console.log("Loading scheduled workouts from localStorage...");
    try {
        const storedScheduled = localStorage.getItem('scheduledWorkouts');
        scheduledWorkouts = storedScheduled ? JSON.parse(storedScheduled) : [];
        
        // Log excluded dates for debugging
        scheduledWorkouts.forEach(workout => {
            if (workout.excludeDates && workout.excludeDates.length > 0) {
                console.log(`Loaded workout ${workout.id} with excluded dates:`, workout.excludeDates);
            }
        });
        
        console.log(`Loaded ${scheduledWorkouts.length} scheduled workouts`);
    } catch (error) {
        console.error("Error loading scheduled workouts:", error);
        scheduledWorkouts = [];
    }
}

// Save scheduled workouts to localStorage
function saveScheduledWorkouts() {
    console.log("Saving scheduled workouts...");
    console.log("Workouts to save:", scheduledWorkouts);
    
    // Log excluded dates for debugging
    scheduledWorkouts.forEach(workout => {
        if (workout.excludeDates && workout.excludeDates.length > 0) {
            console.log(`Workout ${workout.id} has excluded dates:`, workout.excludeDates);
        }
    });
    
    localStorage.setItem('scheduledWorkouts', JSON.stringify(scheduledWorkouts));
}

// Load workout logs from localStorage
function loadWorkoutLogs() {
    console.log("Loading workout logs from localStorage...");
    try {
        const storedLogs = localStorage.getItem('workoutLogs');
        workoutLogs = storedLogs ? JSON.parse(storedLogs) : [];
        console.log(`Loaded ${workoutLogs.length} workout logs`);
    } catch (error) {
        console.error("Error loading workout logs:", error);
        workoutLogs = [];
    }
}

// Save workout logs to localStorage
function saveWorkoutLogs() {
    console.log("Saving workout logs to localStorage...");
    localStorage.setItem('workoutLogs', JSON.stringify(workoutLogs));
}

// Render workout cards
function renderWorkoutCards() {
    console.log("Rendering workout cards...");
    if (!workoutCardsContainer) {
        console.error("Workout cards container not found!");
        return;
    }
    
    workoutCardsContainer.innerHTML = '';
    
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
    
    // Update button states
    updateScrollButtons();
    
    console.log(`Max scroll position: ${maxScrollPosition}, Visible cards: ${visibleCards}`);
}

// Update scroll button states
function updateScrollButtons() {
    if (!scrollLeftBtn || !scrollRightBtn) {
        console.error("Scroll buttons not found!");
        return;
    }
    
    scrollLeftBtn.classList.toggle('disabled', scrollPosition <= 0);
    scrollRightBtn.classList.toggle('disabled', scrollPosition >= maxScrollPosition);
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
    
    scrollPosition = Math.max(0, Math.min(newPosition, maxScrollPosition));
    workoutCardsContainer.style.transform = `translateX(-${scrollPosition}px)`;
    
    updateScrollButtons();
}

// Toggle favorite status
function toggleFavorite(workoutId) {
    console.log(`Toggling favorite for workout ID: ${workoutId}`);
    
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        return;
    }
    
    workout.isFavorite = !workout.isFavorite;
    
    // Update UI
    const favoriteBtn = document.querySelector(`.workout-card[data-id="${workoutId}"] .favorite-button`);
    if (favoriteBtn) {
        favoriteBtn.classList.toggle('active', workout.isFavorite);
        const icon = favoriteBtn.querySelector('.material-icons');
        if (icon) {
            icon.textContent = workout.isFavorite ? 'favorite' : 'favorite_border';
        }
    }
    
    // Save changes
    saveWorkouts();
    
    console.log(`Workout favorite status updated: ${workout.isFavorite}`);
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
    
    return workoutLogs.filter(log => new Date(log.date) >= startDate);
}

// Render workout log
function renderWorkoutLog() {
    console.log("Rendering workout log...");
    if (!logEntriesContainer) {
        console.error("Log entries container not found!");
        return;
    }
    
    const filteredLog = getFilteredWorkoutLog();
    logEntriesContainer.innerHTML = '';
    
    if (filteredLog.length === 0) {
        logEntriesContainer.innerHTML = '<div class="empty-log">No workouts logged yet. Start a workout to log it!</div>';
        return;
    }
    
    // Initially show only 5 entries
    const initialEntries = 5;
    const hasMoreEntries = filteredLog.length > initialEntries;
    
    // Create a function to render entries
    const renderEntries = (entries) => {
        entries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const year = date.getFullYear();
            
            logEntry.innerHTML = `
                <div class="entry-date">
                    <div class="date">${formattedDate}</div>
                    <div class="year">${year}</div>
                </div>
                <div class="entry-details">
                    <h3>${entry.workout.title}</h3>
                    <div class="entry-stats">
                        <span><span class="material-icons">schedule</span> ${entry.workout.duration}</span>
                        <span><span class="material-icons">event</span> ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            `;
            
            logEntriesContainer.appendChild(logEntry);
        });
    };
    
    // Render the initial entries
    renderEntries(filteredLog.slice(0, initialEntries));
    
    // Add "Show More" button if there are more entries
    if (hasMoreEntries) {
        const showMoreContainer = document.createElement('div');
        showMoreContainer.className = 'show-more-container';
        
        const showMoreButton = document.createElement('button');
        showMoreButton.className = 'show-more-button';
        showMoreButton.innerHTML = `
            <span class="material-icons">expand_more</span>
            Show More (${filteredLog.length - initialEntries} more)
        `;
        
        showMoreButton.addEventListener('click', function() {
            // Remove the show more button
            showMoreContainer.remove();
            
            // Render the remaining entries
            renderEntries(filteredLog.slice(initialEntries));
            
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
    console.log("Total scheduled workouts:", scheduledWorkouts.length);
    
    if (!upcomingWorkoutsContainer) {
        console.error("Upcoming workouts container not found!");
        return;
    }
    
    upcomingWorkoutsContainer.innerHTML = '';
    
    if (scheduledWorkouts.length === 0) {
        upcomingWorkoutsContainer.innerHTML = '<div class="empty-upcoming">No upcoming workouts scheduled</div>';
        return;
    }
    
    // Generate all occurrences for repeating workouts
    const allOccurrences = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Look ahead 30 days for repeating workouts
    const lookAheadDays = 30;
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + lookAheadDays);
    
    scheduledWorkouts.forEach(scheduled => {
        console.log("Processing scheduled workout:", scheduled);
        console.log("Workout ID:", scheduled.id);
        console.log("Repeat type:", scheduled.repeat);
        console.log("Excluded dates:", scheduled.excludeDates || []);
        
        const workout = workouts.find(w => w.id === scheduled.workoutId);
        if (!workout) {
            console.error(`Workout with ID ${scheduled.workoutId} not found!`);
            return;
        }
        
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
            
        console.log("Original date:", originalDateString);
        console.log("Is original date excluded:", isOriginalDateExcluded);
        
        // Only add if it's today or in the future and not excluded
        if (originalDate >= today && !isOriginalDateExcluded) {
            console.log("Adding original occurrence to list");
            allOccurrences.push({
                id: scheduled.id,
                date: originalDate,
                workout: workout,
                isRepeating: scheduled.repeat !== 'never',
                repeatType: scheduled.repeat,
                originalSchedule: scheduled,
                seriesId: scheduled.seriesId || scheduled.id, // Use seriesId if available, otherwise use id
                // For rescheduled occurrences, preserve the repeat indicator
                isRescheduled: scheduled.isRescheduled || false,
                originalRepeatType: scheduled.originalRepeatType
            });
        }
        
        // Add repeating occurrences
        if (scheduled.repeat !== 'never') {
            console.log("Generating repeating occurrences for workout:", scheduled.id);
            const repeatDates = generateRepeatingDates(
                originalDate, 
                scheduled.repeat, 
                scheduled.customOptions,
                maxDate,
                scheduled.excludeDates || []
            );
            
            console.log(`Generated ${repeatDates.length} repeat dates`);
            
            repeatDates.forEach(repeatDate => {
                console.log("Adding repeat occurrence:", repeatDate);
                allOccurrences.push({
                    id: `${scheduled.id}-${repeatDate.getTime()}`,
                    date: repeatDate,
                    workout: workout,
                    isRepeating: true,
                    repeatType: scheduled.repeat,
                    originalSchedule: scheduled,
                    seriesId: scheduled.seriesId || scheduled.id // Use seriesId if available, otherwise use id
                });
            });
        }
    });
    
    // Sort by date
    allOccurrences.sort((a, b) => a.date - b.date);
    
    console.log(`Total occurrences generated: ${allOccurrences.length}`);
    
    // Filter out duplicate occurrences (same workout on same date and time)
    const uniqueOccurrences = [];
    const seenDateTimes = new Map();
    
    allOccurrences.forEach(occurrence => {
        const dateTimeKey = `${occurrence.workout.id}-${occurrence.date.toISOString().split('T')[0]}-${occurrence.date.getHours()}-${occurrence.date.getMinutes()}`;
        
        // If we haven't seen this workout at this date/time before, or if this is a rescheduled occurrence, keep it
        if (!seenDateTimes.has(dateTimeKey) || occurrence.isRescheduled) {
            uniqueOccurrences.push(occurrence);
            seenDateTimes.set(dateTimeKey, true);
        } else {
            console.log(`Filtered out duplicate occurrence: ${occurrence.workout.title} on ${occurrence.date.toLocaleDateString()} at ${occurrence.date.toLocaleTimeString()}`);
        }
    });
    
    console.log(`After filtering duplicates: ${uniqueOccurrences.length} occurrences`);
    
    if (uniqueOccurrences.length === 0) {
        upcomingWorkoutsContainer.innerHTML = '<div class="empty-upcoming">No upcoming workouts scheduled</div>';
        return;
    }
    
    // Initially show only 5 occurrences
    const initialCount = 5;
    const hasMoreOccurrences = uniqueOccurrences.length > initialCount;
    
    // Function to render workout occurrences
    const renderOccurrences = (occurrences) => {
        occurrences.forEach(occurrence => {
            const card = document.createElement('div');
            card.className = 'upcoming-workout-card';
            card.dataset.id = occurrence.id;
            card.dataset.seriesId = occurrence.seriesId;
            
            card.innerHTML = `
                <div class="upcoming-workout-date">
                    <div class="date">${occurrence.date.toLocaleDateString()}</div>
                    <div class="time">${occurrence.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="upcoming-workout-content">
                    <h3>${occurrence.workout.title}</h3>
                    <div class="upcoming-workout-meta">
                        <span class="duration"><span class="material-icons">schedule</span> ${occurrence.workout.duration}</span>
                        <span class="difficulty">${occurrence.workout.difficulty}</span>
                    </div>
                    ${occurrence.isRepeating ? 
                      `<div class="repeat-indicator"><span class="material-icons">repeat</span> ${formatRepeatType(occurrence.repeatType)}</div>` : 
                      (occurrence.isRescheduled && occurrence.originalRepeatType ? 
                       `<div class="repeat-indicator"><span class="material-icons">repeat</span> ${formatRepeatType(occurrence.originalRepeatType)}</div>` : 
                       (occurrence.originalSchedule && occurrence.originalSchedule.originalRepeatType ? 
                        `<div class="repeat-indicator"><span class="material-icons">repeat</span> ${formatRepeatType(occurrence.originalSchedule.originalRepeatType)}</div>` : ''))}
                </div>
                <div class="upcoming-workout-actions">
                    <button class="reschedule-button" title="Reschedule">
                        <span class="material-icons">event</span>
                    </button>
                    <button class="delete-button" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const deleteBtn = card.querySelector('.delete-button');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    showDeleteOptions(occurrence);
                });
            }
            
            const rescheduleBtn = card.querySelector('.reschedule-button');
            if (rescheduleBtn) {
                rescheduleBtn.addEventListener('click', () => {
                    showRescheduleDialog(occurrence);
                });
            }
            
            upcomingWorkoutsContainer.appendChild(card);
        });
    };
    
    // Render initial occurrences
    renderOccurrences(uniqueOccurrences.slice(0, initialCount));
    
    // Add "Show More" button if there are more occurrences
    if (hasMoreOccurrences) {
        const showMoreContainer = document.createElement('div');
        showMoreContainer.className = 'show-more-container';
        
        const showMoreButton = document.createElement('button');
        showMoreButton.className = 'show-more-button';
        showMoreButton.innerHTML = `
            <span class="material-icons">expand_more</span>
            Show More (${uniqueOccurrences.length - initialCount} more)
        `;
        
        showMoreButton.addEventListener('click', function() {
            // Remove the show more button
            showMoreContainer.remove();
            
            // Render the remaining occurrences
            renderOccurrences(uniqueOccurrences.slice(initialCount));
            
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
                // Re-render with only the initial occurrences
                renderScheduledWorkouts();
            });
            
            showLessContainer.appendChild(showLessButton);
            upcomingWorkoutsContainer.appendChild(showLessContainer);
        });
        
        showMoreContainer.appendChild(showMoreButton);
        upcomingWorkoutsContainer.appendChild(showMoreContainer);
    }
    
    console.log("Scheduled workouts rendering complete");
    
    // Also update the calendar if it's visible
    updateCalendarView();
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
    
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        return;
    }
    
    // Expand the workout view
    expandWorkout(workoutId);
    
    // Don't log the workout immediately - let the user click "Finish Workout" instead
}

// Log workout completion
function logWorkoutCompletion(workout) {
    // Log the completed workout
    const now = new Date();
    const logEntry = {
        id: Date.now(),
        workout: workout,
        date: now.toISOString(),
        duration: workout.duration,
        calories: Math.floor(Math.random() * 300) + 100
    };
    
    workoutLogs.unshift(logEntry); // Add to beginning of array
    saveWorkoutLogs();
    
    // Update UI
    renderWorkoutLog();
    
    console.log("Workout logged successfully");
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
    const dialogOverlay = document.getElementById('dialogOverlay');
    if (!dialogOverlay) {
        console.error("Dialog overlay not found!");
        return;
    }
    
    // Update dialog title
    const dialogTitle = dialogOverlay.querySelector('.dialog-title');
    if (dialogTitle) {
        dialogTitle.textContent = `Schedule: ${workout.title}`;
    }
    
    // Show scheduling options
    const scheduleCheckbox = document.getElementById('scheduleWorkout');
    if (scheduleCheckbox) {
        scheduleCheckbox.checked = true;
        
        // Show schedule options
        const scheduleOptions = document.getElementById('scheduleOptions');
        if (scheduleOptions) {
            scheduleOptions.style.display = 'block';
        }
    }
    
    // Store the workout ID for later use
    dialogOverlay.dataset.workoutId = workoutId;
    
    // Set default date and time (tomorrow at current time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInput = document.getElementById('workoutDate');
    if (dateInput) {
        dateInput.valueAsDate = tomorrow;
    }
    
    const timeInput = document.getElementById('workoutTime');
    if (timeInput) {
        const hours = String(tomorrow.getHours()).padStart(2, '0');
        const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
    
    // Show the dialog
    dialogOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Schedule a workout
function scheduleWorkout(workoutId, scheduleData) {
    console.log(`Scheduling workout ID: ${workoutId}`);
    console.log("Schedule data:", scheduleData);
    
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        return false;
    }
    
    // Generate a unique ID for this scheduled workout
    const scheduledId = Date.now();
    
    // Create scheduled workout
    const scheduledWorkout = {
        id: scheduledId,
        workoutId: workoutId,
        date: scheduleData.date,
        time: scheduleData.time,
        repeat: scheduleData.repeat || 'never',
        customOptions: scheduleData.customOptions || null,
        excludeDates: scheduleData.excludeDates || []
    };
    
    // If this is a recurring workout, add a seriesId
    if (scheduleData.repeat && scheduleData.repeat !== 'never') {
        scheduledWorkout.seriesId = scheduledId;
    }
    
    // Add to list
    scheduledWorkouts.push(scheduledWorkout);
    saveScheduledWorkouts();
    
    // Update UI
    renderScheduledWorkouts();
    renderWorkoutCards();
    
    console.log("Workout scheduled successfully");
    return true;
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
        console.error(`Original scheduled workout with ID ${occurrence.originalSchedule.id} not found!`);
        return;
    }
    
    console.log("Found scheduled workout:", scheduledWorkout);
    console.log("Scheduled workout repeat:", scheduledWorkout.repeat);
    console.log("Scheduled workout excludeDates:", scheduledWorkout.excludeDates);
    
    // If this is the original occurrence (not a generated one) and it's not a recurring workout
    if (occurrence.id === scheduledWorkout.id && scheduledWorkout.repeat === 'never') {
        console.log("This is the original occurrence of a non-recurring workout - deleting directly");
        // Just delete it directly
        const index = scheduledWorkouts.findIndex(s => s.id === occurrence.id);
        if (index !== -1) {
            scheduledWorkouts.splice(index, 1);
            saveScheduledWorkouts();
            renderScheduledWorkouts();
            renderWorkoutCards();
            console.log("Original non-recurring occurrence deleted successfully");
        }
        return;
    }
    
    // Initialize excludeDates array if it doesn't exist
    if (!scheduledWorkout.excludeDates) {
        scheduledWorkout.excludeDates = [];
    }
    
    // Get the date string in YYYY-MM-DD format
    const dateString = occurrence.date.toISOString().split('T')[0];
    console.log("Adding date to exclusion list:", dateString);
    
    // Add the date to the exclusion list if it's not already there
    if (!scheduledWorkout.excludeDates.includes(dateString)) {
        scheduledWorkout.excludeDates.push(dateString);
        console.log(`Added date ${dateString} to exclusion list`);
    } else {
        console.log(`Date ${dateString} is already in exclusion list`);
    }
    
    saveScheduledWorkouts();
    renderScheduledWorkouts();
    renderWorkoutCards();
    console.log("Single occurrence deleted successfully");
}

// Delete a scheduled workout
function deleteScheduledWorkout(scheduledId, deleteEntireSeries = false) {
    console.log(`Deleting scheduled workout ID: ${scheduledId}, Delete entire series: ${deleteEntireSeries}`);
    
    if (deleteEntireSeries) {
        // Find the workout to get its seriesId
        const workout = scheduledWorkouts.find(s => s.id === scheduledId);
        if (workout) {
            const seriesId = workout.seriesId || workout.id;
            
            // Remove all workouts with the same seriesId
            scheduledWorkouts = scheduledWorkouts.filter(s => {
                const workoutSeriesId = s.seriesId || s.id;
                return workoutSeriesId !== seriesId;
            });
            
            saveScheduledWorkouts();
            renderScheduledWorkouts();
            renderWorkoutCards();
            console.log("Entire workout series deleted successfully");
        } else {
            console.error(`Scheduled workout with ID ${scheduledId} not found!`);
        }
    } else {
        // Just delete the single occurrence
        const index = scheduledWorkouts.findIndex(s => s.id === scheduledId);
        if (index !== -1) {
            // Get the workout we're deleting
            const workoutToDelete = scheduledWorkouts[index];
            
            // Check if this is part of a series
            if (workoutToDelete.repeat !== 'never' || workoutToDelete.seriesId) {
                console.error("Attempted to delete a single occurrence of a recurring workout directly. Use handleSingleOccurrenceDeletion instead.");
                return;
            }
            
            // Remove just this single workout
            scheduledWorkouts.splice(index, 1);
            
            // Also delete any scheduled workouts for this workout
            const scheduledToDelete = scheduledWorkouts.filter(s => s.workoutId === workoutToDelete.workoutId);
            if (scheduledToDelete.length > 0) {
                scheduledWorkouts = scheduledWorkouts.filter(s => s.workoutId !== workoutToDelete.workoutId);
                saveScheduledWorkouts();
                renderScheduledWorkouts();
            }
            
            console.log("Single scheduled workout deleted successfully");
        } else {
            console.error(`Scheduled workout with ID ${scheduledId} not found!`);
        }
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

// Add a workout
function addWorkout(workoutData) {
    console.log("Adding workout:", workoutData);
    
    // Create workout object
    const workout = {
        id: Date.now(),
        title: workoutData.title,
        description: workoutData.description,
        duration: workoutData.duration,
        difficulty: workoutData.difficulty,
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
    
    // Add to list
    workouts.push(workout);
    saveWorkouts();
    
    // Update UI
    renderWorkoutCards();
    calculateMaxScroll();
    
    console.log("Workout added successfully");
    return true;
}

// Delete a workout
function deleteWorkout(workoutId) {
    console.log(`Deleting workout ID: ${workoutId}`);
    
    // Remove confirmation popup - just delete directly
    const index = workouts.findIndex(w => w.id === workoutId);
    if (index !== -1) {
        workouts.splice(index, 1);
        saveWorkouts();
        
        // Also delete any scheduled workouts for this workout
        const scheduledToDelete = scheduledWorkouts.filter(s => s.workoutId === workoutId);
        if (scheduledToDelete.length > 0) {
            scheduledWorkouts = scheduledWorkouts.filter(s => s.workoutId !== workoutId);
            saveScheduledWorkouts();
            renderScheduledWorkouts();
        }
        
        // Update UI
        renderWorkoutCards();
        calculateMaxScroll();
        
        console.log("Workout deleted successfully");
    } else {
        console.error(`Workout with ID ${workoutId} not found!`);
    }
}

// Expand workout view
function expandWorkout(workoutId) {
    console.log(`Expanding workout ID: ${workoutId}`);
    
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) {
        console.error(`Workout with ID ${workoutId} not found!`);
        return;
    }
    
    if (!expandedWorkoutOverlay || !expandedWorkoutContainer) {
        console.error("Expanded workout elements not found!");
        return;
    }
    
    selectedWorkout = workout;
    
    let videoHtml = '';
    let videoId = '';
    if (workout.video) {
        if (workout.video.type === 'youtube') {
            videoId = getYoutubeVideoId(workout.video.url);
            const embedUrl = getYoutubeEmbedUrl(workout.video.url);
            videoHtml = `
                <div class="video-player">
                    <iframe 
                        id="youtubePlayer"
                        src="${embedUrl}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        } else if (workout.video.type === 'file') {
            videoHtml = `
                <div class="video-player">
                    <video id="videoPlayer" controls src="${workout.video.url}"></video>
                </div>
            `;
        }
    }
    
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
            <p>${workout.description}</p>
            <div class="workout-meta">
                <span class="duration"><span class="material-icons">schedule</span> ${workout.duration}</span>
                <span class="difficulty">${workout.difficulty}</span>
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
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    // Initialize DOM elements
    workoutCardsContainer = document.getElementById('workoutCardsRef');
    upcomingWorkoutsContainer = document.getElementById('upcomingWorkouts');
    workoutLogContainer = document.getElementById('workoutLog');
    logEntriesContainer = document.getElementById('logEntries');
    calendarContainer = document.getElementById('calendarContainer');
    expandedWorkoutOverlay = document.getElementById('expandedWorkoutOverlay');
    expandedWorkoutContainer = document.querySelector('.expanded-workout-container');
    deleteWorkoutOptionsDialog = document.getElementById('deleteWorkoutOptionsDialog');
    rescheduleWorkoutDialog = document.getElementById('rescheduleWorkoutDialog');
    scrollLeftBtn = document.getElementById('scrollLeft');
    scrollRightBtn = document.getElementById('scrollRight');
    dateFilterBtns = document.querySelectorAll('.date-filter');
    
    // Check if elements exist
    if (!workoutCardsContainer) {
        console.error("Workout cards container not found!");
    }
    
    if (!upcomingWorkoutsContainer) {
        console.error("Upcoming workouts container not found!");
    }
    
    // Set up scroll buttons
    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => scrollWorkouts('left'));
    } else {
        console.error("Scroll left button not found!");
    }
    
    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => scrollWorkouts('right'));
    } else {
        console.error("Scroll right button not found!");
    }
    
    // Set up date filter buttons
    if (dateFilterBtns && dateFilterBtns.length > 0) {
        dateFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setDateFilter(btn.getAttribute('data-filter'));
            });
        });
    } else {
        console.error("Date filter buttons not found!");
    }
    
    // Set up calendar toggle
    const toggleCalendarBtn = document.getElementById('toggleCalendar');
    if (toggleCalendarBtn) {
        toggleCalendarBtn.addEventListener('click', toggleCalendar);
    } else {
        console.error("Toggle calendar button not found!");
    }
    
    // Set up calendar navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => navigateCalendar(-1));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => navigateCalendar(1));
    }
    
    // Load data
    loadWorkouts();
    loadScheduledWorkouts();
    loadWorkoutLogs();
    
    // Render UI
    renderWorkoutCards();
    renderScheduledWorkouts();
    renderWorkoutLog();
    
    // Set up event listeners for the delete options dialog
    if (deleteWorkoutOptionsDialog) {
        document.getElementById('cancelDeleteWorkout').addEventListener('click', function() {
            deleteWorkoutOptionsDialog.style.display = 'none';
        });
        
        // Close dialog when clicking outside
        deleteWorkoutOptionsDialog.addEventListener('click', function(e) {
            if (e.target === deleteWorkoutOptionsDialog) {
                deleteWorkoutOptionsDialog.style.display = 'none';
            }
        });
    }
    
    // Set up event listeners for the reschedule dialog
    if (rescheduleWorkoutDialog) {
        document.getElementById('cancelReschedule').addEventListener('click', function() {
            rescheduleWorkoutDialog.style.display = 'none';
        });
        
        document.getElementById('confirmReschedule').addEventListener('click', function() {
            const dateInput = document.getElementById('rescheduleDate');
            const timeInput = document.getElementById('rescheduleTime');
            const adjustSeriesToggle = document.getElementById('adjustSeriesToggle');
            
            if (!dateInput.value || !timeInput.value) {
                alert('Please select both date and time');
                return;
            }
            
            // Get the workout occurrence from the stored ID
            const workout = scheduledWorkouts.find(s => s.id === currentScheduleId);
            if (workout) {
                // For generated occurrences, we need to use the date from currentWorkoutId
                let oldDateTime;
                
                if (typeof currentWorkoutId === 'string' && currentWorkoutId.includes('-')) {
                    // This is a generated occurrence, extract the timestamp
                    const timestamp = currentWorkoutId.split('-')[1];
                    oldDateTime = new Date(parseInt(timestamp));
                } else {
                    // This is the original occurrence
                    oldDateTime = new Date(`${workout.date}T${workout.time}`);
                }
                
                const newDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
                const adjustSeries = adjustSeriesToggle.checked && (workout.repeat !== 'never');
                
                rescheduleWorkout(currentScheduleId, oldDateTime, newDateTime, adjustSeries);
            }
            
            rescheduleWorkoutDialog.style.display = 'none';
        });
        
        // Close dialog when clicking outside
        rescheduleWorkoutDialog.addEventListener('click', function(e) {
            if (e.target === rescheduleWorkoutDialog) {
                rescheduleWorkoutDialog.style.display = 'none';
            }
        });
    }
    
    // Add workout button
    const addWorkoutBtn = document.getElementById('openAddWorkoutDialog');
    if (addWorkoutBtn) {
        addWorkoutBtn.addEventListener('click', function() {
            const addWorkoutDialog = document.getElementById('addWorkoutDialog');
            if (addWorkoutDialog) {
                addWorkoutDialog.style.display = 'flex';
            }
        });
    } else {
        console.error("Add workout button not found!");
    }
    
    // Calculate initial max scroll
    calculateMaxScroll();
    
    // Listen for window resize to recalculate max scroll
    window.addEventListener('resize', function() {
        calculateMaxScroll();
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
    
    console.log("App initialization complete");
}); 