// DOM Elements
let toggleCalendarBtn;
let calendarContainer;
let upcomingWorkoutsContainer;
let currentMonthYearElement;
let calendarDaysContainer;
let prevMonthBtn;
let nextMonthBtn;
let scheduleWorkoutCheckbox;
let scheduleOptionsContainer;
let repeatOptionSelect;
let customRepeatOptionsContainer;
let rescheduleDialogOverlay;
let rescheduleForm;
let newWorkoutDateInput;
let newWorkoutTimeInput;
let adjustFollowingCheckbox;
let cancelRescheduleBtn;
let confirmRescheduleBtn;

// Calendar state
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let scheduledWorkouts = [];
let selectedWorkoutToReschedule = null;
let calendarVisible = false;

// Initialize the calendar
function initCalendar() {
    console.log("Initializing calendar...");
    
    // Load any previously scheduled workouts
    loadScheduledWorkouts();
    
    // Initialize calendar elements
    toggleCalendarBtn = document.getElementById('toggleCalendar');
    calendarContainer = document.getElementById('calendarContainer');
    upcomingWorkoutsContainer = document.getElementById('upcomingWorkouts');
    currentMonthYearElement = document.getElementById('currentMonthYear');
    calendarDaysContainer = document.getElementById('calendarDays');
    prevMonthBtn = document.getElementById('prevMonth');
    nextMonthBtn = document.getElementById('nextMonth');
    
    if (!toggleCalendarBtn) {
        console.error("Toggle calendar button not found!");
        return;
    }
    
    if (!calendarContainer) {
        console.error("Calendar container not found!");
        return;
    }
    
    if (!upcomingWorkoutsContainer) {
        console.error("Upcoming workouts container not found!");
        return;
    }
    
    // Set up event listeners
    toggleCalendarBtn.addEventListener('click', toggleCalendar);
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    }
    
    // Initial render
    renderCalendar();
    renderUpcomingWorkouts();
    console.log("Calendar initialized successfully");
}

// Toggle calendar visibility
function toggleCalendar() {
    console.log("Toggling calendar visibility");
    calendarVisible = !calendarVisible;
    
    if (calendarVisible) {
        calendarContainer.classList.add('visible');
        toggleCalendarBtn.querySelector('.material-icons').textContent = 'expand_less';
        toggleCalendarBtn.querySelector('span:not(.material-icons)').textContent = 'Hide Calendar';
        renderCalendar();
    } else {
        calendarContainer.classList.remove('visible');
        toggleCalendarBtn.querySelector('.material-icons').textContent = 'expand_more';
        toggleCalendarBtn.querySelector('span:not(.material-icons)').textContent = 'Show Calendar';
    }
}

// Navigate to previous/next month
function navigateMonth(direction) {
    console.log(`Navigate month: ${direction}`);
    currentMonth += direction;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderCalendar();
}

// Render the calendar
function renderCalendar() {
    if (!calendarVisible) return;
    
    console.log("Rendering calendar...");
    
    // Clear existing upcoming workouts
    upcomingWorkoutsContainer.innerHTML = '';
    
    // Get current date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Filter and sort upcoming workouts
    const upcomingWorkouts = scheduledWorkouts
        .filter(workout => {
            const workoutDate = new Date(workout.scheduledDate);
            return workoutDate >= now;
        })
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    console.log(`Found ${upcomingWorkouts.length} upcoming workouts`);
    
    // Display upcoming workouts
    upcomingWorkouts.forEach(workout => {
        const workoutCard = createUpcomingWorkoutCard(workout);
        upcomingWorkoutsContainer.appendChild(workoutCard);
    });
}

// Create a day element for the calendar
function createDayElement(dayNumber, isOtherMonth, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    const dayNumberElement = document.createElement('div');
    dayNumberElement.className = 'day-number';
    dayNumberElement.textContent = dayNumber;
    
    dayElement.appendChild(dayNumberElement);
    
    return dayElement;
}

// Get workouts scheduled for a specific day
function getWorkoutsForDay(date) {
    const dateString = date.toDateString();
    
    return scheduledWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate.toDateString() === dateString;
    });
}

// Render upcoming workouts
function renderUpcomingWorkouts() {
    console.log("Rendering upcoming workouts...");
    if (!upcomingWorkoutsContainer) {
        console.error("Upcoming workouts container not found!");
        return;
    }
    
    upcomingWorkoutsContainer.innerHTML = '';
    
    // Get current date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Filter and sort upcoming workouts
    const upcomingWorkouts = scheduledWorkouts
        .filter(workout => {
            const workoutDate = new Date(workout.scheduledDate);
            return workoutDate >= now;
        })
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    console.log(`Found ${upcomingWorkouts.length} upcoming workouts`);
    
    if (upcomingWorkouts.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-upcoming';
        emptyMessage.textContent = 'No upcoming workouts scheduled. Add a workout to your calendar!';
        upcomingWorkoutsContainer.appendChild(emptyMessage);
        return;
    }
    
    // Show only the next 3 workouts
    const nextWorkouts = upcomingWorkouts.slice(0, 3);
    
    nextWorkouts.forEach(workout => {
        const card = createUpcomingWorkoutCard(workout);
        upcomingWorkoutsContainer.appendChild(card);
    });
    
    console.log("Upcoming workouts rendering complete");
}

// Create an upcoming workout card
function createUpcomingWorkoutCard(workout) {
    console.log("Creating upcoming workout card for:", workout);
    const card = document.createElement('div');
    card.className = 'upcoming-workout-card';
    
    const workoutDate = new Date(workout.scheduledDate);
    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const formattedDate = workoutDate.toLocaleDateString('en-US', dateOptions);
    const formattedTime = workoutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    card.innerHTML = `
        <div class="upcoming-workout-date">
            <div class="date">${formattedDate}</div>
            <div class="time">${formattedTime}</div>
        </div>
        <div class="upcoming-workout-content">
            <h3>${workout.title}</h3>
            <div class="upcoming-workout-meta">
                <span class="duration"><span class="material-icons">schedule</span> ${workout.duration}</span>
                <span class="difficulty">${workout.difficulty}</span>
            </div>
            <div class="upcoming-workout-actions">
                <button class="delete-button" data-workout-date="${workout.scheduledDate}">
                    <span class="material-icons">delete</span>
                    Delete
                </button>
                <button class="start-button">
                    Start Workout
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const deleteBtn = card.querySelector('.delete-button');
    deleteBtn.addEventListener('click', () => deleteScheduledWorkout(workout));
    
    const startBtn = card.querySelector('.start-button');
    startBtn.addEventListener('click', () => {
        if (typeof window.startWorkout === 'function') {
            window.startWorkout(workout);
        } else {
            console.error("startWorkout function not found in global scope");
        }
    });
    
    return card;
}

// Delete a scheduled workout
function deleteScheduledWorkout(workout) {
    console.log(`Deleting scheduled workout:`, workout);
    
    if (confirm('Are you sure you want to delete this scheduled workout?')) {
        // Find the workout index
        const index = scheduledWorkouts.findIndex(w => 
            w.scheduledDate === workout.scheduledDate && 
            w.title === workout.title
        );
        
        if (index !== -1) {
            // Remove the workout
            scheduledWorkouts.splice(index, 1);
            
            // Save changes
            saveScheduledWorkouts();
            
            // Re-render calendar
            renderCalendar();
            renderUpcomingWorkouts();
            
            console.log("Scheduled workout deleted successfully");
        } else {
            console.error("Scheduled workout not found");
        }
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

// Open reschedule dialog
function openRescheduleDialog(workout) {
    console.log("Open reschedule dialog called");
    if (!rescheduleDialogOverlay || !newWorkoutDateInput || !newWorkoutTimeInput) {
        console.error("Reschedule dialog elements not found!");
        return;
    }
    
    selectedWorkoutToReschedule = workout;
    
    // Set current date and time
    const workoutDate = new Date(workout.date);
    const dateString = workoutDate.toISOString().split('T')[0];
    const timeString = `${String(workoutDate.getHours()).padStart(2, '0')}:${String(workoutDate.getMinutes()).padStart(2, '0')}`;
    
    newWorkoutDateInput.value = dateString;
    newWorkoutTimeInput.value = timeString;
    
    // Show dialog
    rescheduleDialogOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close reschedule dialog
function closeRescheduleDialog() {
    console.log("Close reschedule dialog called");
    if (!rescheduleDialogOverlay) {
        console.error("Reschedule dialog overlay not found!");
        return;
    }
    
    rescheduleDialogOverlay.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    selectedWorkoutToReschedule = null;
}

// Handle workout rescheduling
function handleReschedule() {
    console.log("Handle reschedule called");
    if (!selectedWorkoutToReschedule || !rescheduleForm || !newWorkoutDateInput || !newWorkoutTimeInput || !adjustFollowingCheckbox) {
        console.error("Reschedule form elements not found or no workout selected!");
        return;
    }
    
    if (!rescheduleForm.checkValidity()) {
        console.error("Reschedule form is invalid!");
        return;
    }
    
    // Get new date and time
    const newDate = new Date(`${newWorkoutDateInput.value}T${newWorkoutTimeInput.value}`);
    const oldDate = new Date(selectedWorkoutToReschedule.date);
    
    // Calculate time difference
    const timeDifference = newDate.getTime() - oldDate.getTime();
    
    // Update the selected workout
    selectedWorkoutToReschedule.date = newDate.toISOString();
    
    // If adjusting following workouts
    if (adjustFollowingCheckbox.checked && selectedWorkoutToReschedule.repeatOption !== 'never') {
        // Get all workouts in the same series (with the same seriesId)
        const seriesWorkouts = scheduledWorkouts.filter(workout => 
            workout.seriesId === selectedWorkoutToReschedule.seriesId && 
            new Date(workout.date) > oldDate
        );
        
        // Adjust each workout in the series
        seriesWorkouts.forEach(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setTime(workoutDate.getTime() + timeDifference);
            workout.date = workoutDate.toISOString();
        });
    }
    
    // Save changes
    saveScheduledWorkouts();
    
    // Update UI
    renderCalendar();
    renderUpcomingWorkouts();
    
    // Close dialog
    closeRescheduleDialog();
}

// Add a scheduled workout
function addScheduledWorkout(workout, date, repeatOption = 'never', customRepeatOptions = null) {
    console.log("Adding scheduled workout:", workout);
    console.log("Date:", date);
    console.log("Repeat option:", repeatOption);
    
    try {
        // Ensure date is a valid Date object
        let scheduledDate;
        if (typeof date === 'string') {
            scheduledDate = new Date(date);
        } else if (date instanceof Date) {
            scheduledDate = date;
        } else {
            throw new Error("Invalid date format");
        }
        
        // Check if date is valid
        if (isNaN(scheduledDate.getTime())) {
            throw new Error("Invalid date");
        }
        
        // Create a deep copy of the workout to avoid reference issues
        const workoutCopy = JSON.parse(JSON.stringify(workout));
        
        // Add the scheduled workout
        const scheduledWorkout = {
            ...workoutCopy,
            scheduledDate: scheduledDate.toISOString(),
            repeatOption,
            customRepeatOptions
        };
        
        // Add to scheduled workouts array
        scheduledWorkouts.push(scheduledWorkout);
        
        // Save to localStorage
        saveScheduledWorkouts();
        
        // Show calendar if it's not visible
        if (!calendarVisible) {
            toggleCalendar();
        }
        
        // Update calendar display
        renderCalendar();
        renderUpcomingWorkouts();
        
        console.log("Workout scheduled successfully");
        return true;
    } catch (error) {
        console.error("Error adding scheduled workout:", error);
        throw error;
    }
}

// Add recurring workout instances
function addRecurringWorkouts(workout, startDate, repeatOption, customRepeatOptions, seriesId) {
    console.log("Adding recurring workouts");
    console.log("Start date:", startDate);
    console.log("Repeat option:", repeatOption);
    
    try {
        // Add workouts for the next 6 months
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
        
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1); // Start from the next day
        
        let count = 0;
        const maxRecurringWorkouts = 100; // Limit to prevent infinite loops
        
        while (currentDate <= endDate && count < maxRecurringWorkouts) {
            // Create a new date object for each iteration to avoid reference issues
            const checkDate = new Date(currentDate.getTime());
            
            if (shouldAddWorkoutOnDate(checkDate, startDate, repeatOption, customRepeatOptions)) {
                // Create a unique ID for this occurrence
                const workoutId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                
                // Create a deep copy of the workout to avoid reference issues
                const workoutCopy = JSON.parse(JSON.stringify(workout));
                
                const scheduledWorkout = {
                    id: workoutId,
                    seriesId: seriesId,
                    workoutData: workoutCopy,
                    date: new Date(checkDate).toISOString(),
                    repeatOption: repeatOption,
                    customRepeatOptions: customRepeatOptions
                };
                
                scheduledWorkouts.push(scheduledWorkout);
                count++;
            }
            
            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Added ${count} recurring workouts`);
    } catch (error) {
        console.error("Error adding recurring workouts:", error);
    }
}

// Check if a workout should be added on a specific date
function shouldAddWorkoutOnDate(date, startDate, repeatOption, customRepeatOptions) {
    try {
        // Validate inputs
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            console.error("Invalid date in shouldAddWorkoutOnDate");
            return false;
        }
        
        if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
            console.error("Invalid start date in shouldAddWorkoutOnDate");
            return false;
        }
        
        if (!repeatOption) {
            console.error("Invalid repeat option in shouldAddWorkoutOnDate");
            return false;
        }
        
        switch (repeatOption) {
            case 'daily':
                return true;
                
            case 'weekly':
                return date.getDay() === startDate.getDay();
                
            case 'biweekly':
                const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                return date.getDay() === startDate.getDay() && daysDiff % 14 === 0;
                
            case 'monthly':
                return date.getDate() === startDate.getDate();
                
            case 'yearly':
                return date.getDate() === startDate.getDate() && date.getMonth() === startDate.getMonth();
                
            case 'custom':
                if (!customRepeatOptions) return false;
                
                if (customRepeatOptions.repeatDays && Array.isArray(customRepeatOptions.repeatDays)) {
                    // Check if the day of week is selected
                    const dayOfWeek = date.getDay().toString();
                    if (!customRepeatOptions.repeatDays.includes(dayOfWeek)) {
                        return false;
                    }
                }
                
                if (customRepeatOptions.repeatFrequency && customRepeatOptions.repeatDay) {
                    // Handle special frequencies (first Monday, last Friday, etc.)
                    if (customRepeatOptions.repeatFrequency !== 'every') {
                        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(customRepeatOptions.repeatDay);
                        
                        if (dayOfWeek === -1 || date.getDay() !== dayOfWeek) {
                            return false;
                        }
                        
                        const weekOfMonth = getWeekOfMonth(date);
                        
                        switch (customRepeatOptions.repeatFrequency) {
                            case 'first':
                                return weekOfMonth === 0;
                            case 'second':
                                return weekOfMonth === 1;
                            case 'third':
                                return weekOfMonth === 2;
                            case 'fourth':
                                return weekOfMonth === 3;
                            case 'last':
                                const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                                const lastWeek = getWeekOfMonth(lastDayOfMonth);
                                return weekOfMonth === lastWeek;
                            default:
                                return false;
                        }
                    }
                }
                
                return true;
                
            default:
                console.error(`Unknown repeat option: ${repeatOption}`);
                return false;
        }
    } catch (error) {
        console.error("Error in shouldAddWorkoutOnDate:", error);
        return false;
    }
}

// Get the week of the month for a date
function getWeekOfMonth(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    
    // Adjust for the first day of the month
    const firstDayOffset = firstDayOfMonth.getDay();
    
    return Math.floor((dayOfMonth + firstDayOffset - 1) / 7);
}

// Save scheduled workouts to localStorage
function saveScheduledWorkouts() {
    console.log("Saving scheduled workouts...");
    try {
        localStorage.setItem('scheduledWorkouts', JSON.stringify(scheduledWorkouts));
        console.log(`Saved ${scheduledWorkouts.length} workouts`);
    } catch (error) {
        console.error("Error saving scheduled workouts:", error);
    }
}

// Load scheduled workouts from localStorage
function loadScheduledWorkouts() {
    console.log("Loading scheduled workouts...");
    const savedWorkouts = localStorage.getItem('scheduledWorkouts');
    if (savedWorkouts) {
        try {
            scheduledWorkouts = JSON.parse(savedWorkouts);
            console.log(`Loaded ${scheduledWorkouts.length} scheduled workouts`);
        } catch (error) {
            console.error("Error loading scheduled workouts:", error);
            scheduledWorkouts = [];
        }
    } else {
        console.log("No scheduled workouts found in storage");
        scheduledWorkouts = [];
    }
}

// Make sure DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, initializing calendar");
    setTimeout(initCalendar, 100); // Small delay to ensure all scripts are loaded
});

// Expose functions to be used by other scripts
window.addScheduledWorkout = addScheduledWorkout;
window.deleteScheduledWorkout = deleteScheduledWorkout; 