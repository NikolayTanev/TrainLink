// Global variables
let workouts = [];
let scheduledWorkouts = [];
let workoutLogs = [];
let selectedWorkout = null;

// DOM Elements
let workoutCardsRef;
let scrollLeftBtn;
let scrollRightBtn;
let dateFilterBtns;
let logEntriesContainer;
let upcomingWorkoutsContainer;
let calendarContainer;
let expandedWorkoutOverlay;
let expandedWorkoutContainer;

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

// Initialize the application
function init() {
    console.log("Initializing main application...");
    
    // Load data from localStorage
    loadWorkouts();
    loadScheduledWorkouts();
    loadWorkoutLogs();
    
    // Get DOM elements
    workoutCardsRef = document.getElementById('workoutCardsRef');
    scrollLeftBtn = document.getElementById('scrollLeft');
    scrollRightBtn = document.getElementById('scrollRight');
    dateFilterBtns = document.querySelectorAll('.date-filter');
    logEntriesContainer = document.getElementById('logEntries');
    upcomingWorkoutsContainer = document.getElementById('upcomingWorkouts');
    calendarContainer = document.getElementById('calendarContainer');
    expandedWorkoutOverlay = document.getElementById('expandedWorkoutOverlay');
    expandedWorkoutContainer = document.getElementById('expandedWorkoutContainer');
    
    // Check if elements exist
    if (!workoutCardsRef) {
        console.error("Workout cards container not found!");
    }
    
    if (!scrollLeftBtn) {
        console.error("Scroll left button not found!");
    } else {
        scrollLeftBtn.addEventListener('click', () => scrollWorkouts('left'));
    }
    
    if (!scrollRightBtn) {
        console.error("Scroll right button not found!");
    } else {
        scrollRightBtn.addEventListener('click', () => scrollWorkouts('right'));
    }
    
    if (!dateFilterBtns || dateFilterBtns.length === 0) {
        console.error("Date filter buttons not found!");
    } else {
        dateFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setDateFilter(btn.getAttribute('data-filter'));
            });
        });
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
    
    // Render UI
    renderWorkoutCards();
    calculateMaxScroll();
    renderWorkoutLog();
    renderScheduledWorkouts();
    
    // Window resize event
    window.addEventListener('resize', calculateMaxScroll);
    
    console.log("Main application initialization complete");
    
    // Expose functions to global scope
    window.addWorkout = addWorkout;
    window.deleteWorkout = deleteWorkout;
    window.toggleFavorite = toggleFavorite;
    window.startWorkout = startWorkout;
    window.scheduleWorkout = scheduleWorkout;
    window.showScheduleDialog = showScheduleDialog;
    window.deleteScheduledWorkout = deleteScheduledWorkout;
    window.expandWorkout = expandWorkout;
}

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
        console.log(`Loaded ${scheduledWorkouts.length} scheduled workouts`);
    } catch (error) {
        console.error("Error loading scheduled workouts:", error);
        scheduledWorkouts = [];
    }
}

// Save scheduled workouts to localStorage
function saveScheduledWorkouts() {
    console.log("Saving scheduled workouts to localStorage...");
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
    if (!workoutCardsRef) {
        console.error("Workout cards container not found!");
        return;
    }
    
    workoutCardsRef.innerHTML = '';
    
    workouts.forEach(workout => {
        const card = document.createElement('div');
        card.className = 'workout-card';
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
        
        workoutCardsRef.appendChild(card);
    });
    
    console.log("Workout cards rendering complete");
}

// Calculate maximum scroll position
function calculateMaxScroll() {
    console.log("Calculating max scroll...");
    if (!workoutCardsRef) {
        console.error("Workout cards container not found!");
        return;
    }
    
    const containerWidth = workoutCardsRef.parentElement.clientWidth;
    const totalWidth = workoutCardsRef.scrollWidth;
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
    if (!workoutCardsRef) {
        console.error("Workout cards container not found!");
        return;
    }
    
    const scrollAmount = cardWidth * (direction === 'left' ? -1 : 1);
    const newPosition = scrollPosition + scrollAmount;
    
    scrollPosition = Math.max(0, Math.min(newPosition, maxScrollPosition));
    workoutCardsRef.style.transform = `translateX(-${scrollPosition}px)`;
    
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
    
    filteredLog.forEach(entry => {
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
    
    console.log("Workout log rendering complete");
}

// Render scheduled workouts
function renderScheduledWorkouts() {
    console.log("Rendering scheduled workouts...");
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
        const workout = workouts.find(w => w.id === scheduled.workoutId);
        if (!workout) {
            console.error(`Workout with ID ${scheduled.workoutId} not found!`);
            return;
        }
        
        // Add the original occurrence
        const originalDate = new Date(`${scheduled.date}T${scheduled.time}`);
        
        // Only add if it's today or in the future
        if (originalDate >= today) {
            allOccurrences.push({
                id: scheduled.id,
                date: originalDate,
                workout: workout,
                isRepeating: scheduled.repeat !== 'never',
                repeatType: scheduled.repeat,
                originalSchedule: scheduled
            });
        }
        
        // Add repeating occurrences
        if (scheduled.repeat !== 'never') {
            const repeatDates = generateRepeatingDates(
                originalDate, 
                scheduled.repeat, 
                scheduled.customOptions,
                maxDate
            );
            
            repeatDates.forEach(repeatDate => {
                allOccurrences.push({
                    id: `${scheduled.id}-${repeatDate.getTime()}`,
                    date: repeatDate,
                    workout: workout,
                    isRepeating: true,
                    repeatType: scheduled.repeat,
                    originalSchedule: scheduled
                });
            });
        }
    });
    
    // Sort by date
    allOccurrences.sort((a, b) => a.date - b.date);
    
    // Limit to the next 10 occurrences
    const upcomingOccurrences = allOccurrences.slice(0, 10);
    
    if (upcomingOccurrences.length === 0) {
        upcomingWorkoutsContainer.innerHTML = '<div class="empty-upcoming">No upcoming workouts scheduled</div>';
        return;
    }
    
    upcomingOccurrences.forEach(occurrence => {
        const card = document.createElement('div');
        card.className = 'upcoming-workout-card';
        card.dataset.id = occurrence.id;
        
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
                ${occurrence.isRepeating ? `<div class="repeat-indicator"><span class="material-icons">repeat</span> ${formatRepeatType(occurrence.repeatType)}</div>` : ''}
            </div>
            <div class="upcoming-workout-actions">
                <button class="reschedule-button">
                    <span class="material-icons">event</span>
                </button>
                <button class="delete-button">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;
        
        // Add event listeners
        const deleteBtn = card.querySelector('.delete-button');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deleteScheduledWorkout(occurrence.originalSchedule.id);
            });
        }
        
        upcomingWorkoutsContainer.appendChild(card);
    });
    
    console.log("Scheduled workouts rendering complete");
    
    // Also update the calendar if it's visible
    updateCalendarView();
}

// Generate repeating dates based on repeat type
function generateRepeatingDates(startDate, repeatType, customOptions, maxDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    // Don't include the original date
    switch (repeatType) {
        case 'daily':
            currentDate.setDate(currentDate.getDate() + 1); // Start from next day
            while (currentDate <= maxDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            break;
            
        case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7); // Start from next week
            while (currentDate <= maxDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 7);
            }
            break;
            
        case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14); // Start from two weeks later
            while (currentDate <= maxDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 14);
            }
            break;
            
        case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1); // Start from next month
            while (currentDate <= maxDate) {
                dates.push(new Date(currentDate));
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            break;
            
        case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1); // Start from next year
            while (currentDate <= maxDate) {
                dates.push(new Date(currentDate));
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
            break;
            
        case 'custom':
            if (customOptions && customOptions.days && customOptions.days.length > 0) {
                // Custom days of week
                const daysOfWeek = customOptions.days.map(d => parseInt(d));
                currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow
                
                while (currentDate <= maxDate) {
                    if (daysOfWeek.includes(currentDate.getDay())) {
                        dates.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            break;
    }
    
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
        allOccurrences.push({
            id: scheduled.id,
            date: originalDate,
            workout: workout,
            isRepeating: scheduled.repeat !== 'never',
            repeatType: scheduled.repeat
        });
        
        // Add repeating occurrences for the current month and adjacent months
        if (scheduled.repeat !== 'never') {
            // Look at 3 months (prev, current, next)
            const startLookDate = new Date(currentCalendarYear, currentCalendarMonth - 1, 1);
            const endLookDate = new Date(currentCalendarYear, currentCalendarMonth + 2, 0);
            
            const repeatDates = generateRepeatingDates(
                originalDate, 
                scheduled.repeat, 
                scheduled.customOptions,
                endLookDate
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
    
    // Create calendar grid
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        const dayNumber = prevMonthDays - i;
        
        const dayDate = new Date(currentCalendarYear, currentCalendarMonth - 1, dayNumber);
        const dayEvents = allOccurrences.filter(o => 
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
        const dayEvents = allOccurrences.filter(o => 
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
        const dayEvents = allOccurrences.filter(o => 
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
    
    // Log the workout immediately
    logWorkoutCompletion(workout);
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
    
    // Create scheduled workout
    const scheduledWorkout = {
        id: Date.now(),
        workoutId: workoutId,
        date: scheduleData.date,
        time: scheduleData.time,
        repeat: scheduleData.repeat || 'never',
        customOptions: scheduleData.customOptions || null
    };
    
    // Add to list
    scheduledWorkouts.push(scheduledWorkout);
    saveScheduledWorkouts();
    
    // Update UI
    renderScheduledWorkouts();
    
    console.log("Workout scheduled successfully");
    return true;
}

// Delete a scheduled workout
function deleteScheduledWorkout(scheduledId) {
    console.log(`Deleting scheduled workout ID: ${scheduledId}`);
    
    // Remove confirmation popup - just delete directly
    const index = scheduledWorkouts.findIndex(s => s.id === scheduledId);
    if (index !== -1) {
        scheduledWorkouts.splice(index, 1);
        saveScheduledWorkouts();
        
        // Update UI
        renderScheduledWorkouts();
        
        console.log("Scheduled workout deleted successfully");
    } else {
        console.error(`Scheduled workout with ID ${scheduledId} not found!`);
    }
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
    if (workout.video) {
        if (workout.video.type === 'youtube') {
            const embedUrl = getYoutubeEmbedUrl(workout.video.url);
            videoHtml = `
                <div class="video-player">
                    <iframe 
                        src="${embedUrl}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
            `;
            
            // Log the workout when video is expanded
            logWorkoutCompletion(workout);
        } else if (workout.video.type === 'file') {
            videoHtml = `
                <div class="video-player">
                    <video controls src="${workout.video.url}"></video>
                </div>
            `;
            
            // Log the workout when video is expanded
            logWorkoutCompletion(workout);
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
            <h2>${workout.title}</h2>
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
    
    expandedWorkoutOverlay.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    selectedWorkout = null;
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
document.addEventListener('DOMContentLoaded', init); 