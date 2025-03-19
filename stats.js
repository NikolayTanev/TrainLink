// Stats page - Completely standalone version

// DOM Elements
const totalWorkoutsElement = document.getElementById('totalWorkouts');
const longestStreakElement = document.getElementById('longestStreak');
const frequencyElement = document.getElementById('frequency');
const topWorkoutElement = document.getElementById('topWorkout');
const topWorkoutCountElement = document.getElementById('topWorkoutCount');
const mostCompletedWorkoutTitleElement = document.getElementById('mostCompletedWorkoutTitle');
const mostCompletedCountElement = document.getElementById('mostCompletedCount');
const mostCompletedThumbnailElement = document.getElementById('mostCompletedThumbnail');

// Data storage for this page only - scoped to avoid conflicts
const statsData = {
    workouts: [],
    workoutLogs: []
};

// Load workouts from localStorage
function loadStatsWorkouts() {
    console.log("Stats page: Loading workouts from localStorage...");
    try {
        const storedWorkouts = localStorage.getItem('workouts');
        statsData.workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
        console.log(`Stats page: Loaded ${statsData.workouts.length} workouts`);
    } catch (error) {
        console.error("Stats page: Error loading workouts:", error);
        statsData.workouts = [];
    }
}

// Load workout logs from localStorage
function loadStatsWorkoutLogs() {
    console.log("Stats page: Loading workout logs from localStorage...");
    try {
        const storedLogs = localStorage.getItem('workoutLogs');
        statsData.workoutLogs = storedLogs ? JSON.parse(storedLogs) : [];
        console.log(`Stats page: Loaded ${statsData.workoutLogs.length} workout logs`);
        
        // Debug: Print sample log
        if (statsData.workoutLogs.length > 0) {
            console.log("Stats page: Sample log entry:", statsData.workoutLogs[0]);
        }
    } catch (error) {
        console.error("Stats page: Error loading workout logs:", error);
        statsData.workoutLogs = [];
    }
}

// Calculate and display total workouts completed
function displayTotalWorkouts() {
    const total = statsData.workoutLogs.length;
    console.log(`Stats page: Total workouts completed: ${total}`);
    if (totalWorkoutsElement) {
        totalWorkoutsElement.textContent = total;
    }
}

// Calculate longest streak (consecutive days with at least one workout)
function calculateLongestStreak() {
    if (statsData.workoutLogs.length === 0) {
        return 0;
    }
    
    // Sort logs by date (oldest first)
    const sortedLogs = [...statsData.workoutLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group logs by date (YYYY-MM-DD)
    const logsByDate = {};
    sortedLogs.forEach(log => {
        if (log && log.date) {
            const date = new Date(log.date).toISOString().split('T')[0];
            logsByDate[date] = (logsByDate[date] || 0) + 1;
        }
    });
    
    // Get array of dates
    const dates = Object.keys(logsByDate).sort();
    
    let currentStreak = 1;
    let longestStreak = 1;
    
    // If there's only one date, return a streak of 1
    if (dates.length <= 1) {
        return 1;
    }
    
    for (let i = 1; i < dates.length; i++) {
        // Get current and previous date
        const currentDate = new Date(dates[i]);
        const prevDate = new Date(dates[i-1]);
        
        // Calculate the difference in days
        const diffTime = currentDate - prevDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            // Consecutive day
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            // Streak broken
            currentStreak = 1;
        }
    }
    
    console.log(`Stats page: Longest streak: ${longestStreak}`);
    return longestStreak;
}

// Calculate and display longest streak
function displayLongestStreak() {
    const streak = calculateLongestStreak();
    if (longestStreakElement) {
        longestStreakElement.textContent = streak;
    }
}

// Calculate workouts per week (average over the last 4 weeks)
function calculateFrequency() {
    if (statsData.workoutLogs.length === 0) {
        return 0;
    }
    
    // Get logs from the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentLogs = statsData.workoutLogs.filter(log => log && log.date && new Date(log.date) >= fourWeeksAgo);
    
    if (recentLogs.length === 0) {
        return 0;
    }
    
    // Calculate average per week
    const weekCount = 4; // 4 weeks
    const frequency = Math.round((recentLogs.length / weekCount) * 10) / 10;
    
    console.log(`Stats page: Weekly frequency: ${frequency} (${recentLogs.length} workouts in last 4 weeks)`);
    return frequency;
}

// Display average workouts per week
function displayFrequency() {
    const frequency = calculateFrequency();
    if (frequencyElement) {
        frequencyElement.textContent = frequency;
    }
}

// Find the most completed workout
function findMostCompletedWorkout() {
    if (statsData.workoutLogs.length === 0) {
        return null;
    }
    
    // Debug logging
    console.log(`Stats page: Analyzing ${statsData.workoutLogs.length} logs to find most completed workout`);
    console.log(`Stats page: Available workouts: ${statsData.workouts.length}`);
    
    // Count completions per workout
    const completionCount = {};
    
    statsData.workoutLogs.forEach((log, index) => {
        // Ensure the log has a workout object with an id
        if (log && log.workout && log.workout.id) {
            const workoutId = log.workout.id;
            completionCount[workoutId] = (completionCount[workoutId] || 0) + 1;
        } else {
            console.warn(`Stats page: Invalid workout log at index ${index}:`, log);
        }
    });
    
    console.log("Stats page: Workout completion counts:", completionCount);
    
    // Find the workout with the highest count
    let maxCount = 0;
    let mostCompletedId = null;
    
    Object.entries(completionCount).forEach(([id, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostCompletedId = parseInt(id);
        }
    });
    
    // If no completions were found, return null
    if (!mostCompletedId) {
        console.log("Stats page: No completed workouts found");
        return null;
    }
    
    // Get the full workout object
    const mostCompleted = statsData.workouts.find(w => w && w.id === mostCompletedId);
    
    if (mostCompleted) {
        console.log(`Stats page: Most completed workout: "${mostCompleted.title}" (${maxCount} times)`);
    } else {
        console.log(`Stats page: Could not find workout with ID ${mostCompletedId} in the ${statsData.workouts.length} available workouts`);
        
        // Try to get the workout details from the log entry
        const sampleLog = statsData.workoutLogs.find(log => log && log.workout && log.workout.id === mostCompletedId);
        if (sampleLog) {
            console.log("Stats page: Found workout details in log:", sampleLog.workout);
            return { workout: sampleLog.workout, count: maxCount };
        }
    }
    
    return { workout: mostCompleted, count: maxCount };
}

// Display most completed workout
function displayMostCompletedWorkout() {
    const result = findMostCompletedWorkout();
    
    if (!result || !result.workout) {
        if (mostCompletedWorkoutTitleElement) {
            mostCompletedWorkoutTitleElement.textContent = '"NO WORKOUT YET"';
        }
        if (mostCompletedCountElement) {
            mostCompletedCountElement.textContent = '0';
        }
        if (mostCompletedThumbnailElement) {
            mostCompletedThumbnailElement.innerHTML = '';
        }
        if (topWorkoutElement) {
            topWorkoutElement.textContent = '"NONE"';
        }
        if (topWorkoutCountElement) {
            topWorkoutCountElement.textContent = '0';
        }
        return;
    }
    
    if (mostCompletedWorkoutTitleElement) {
        mostCompletedWorkoutTitleElement.textContent = `"${result.workout.title}"`;
    }
    if (mostCompletedCountElement) {
        mostCompletedCountElement.textContent = result.count;
    }
    
    // Display the thumbnail if available
    if (mostCompletedThumbnailElement) {
        if (result.workout.video && result.workout.video.thumbnail) {
            mostCompletedThumbnailElement.innerHTML = `
                <img src="${result.workout.video.thumbnail}" alt="${result.workout.title}">
            `;
        } else {
            // Display icon if no thumbnail
            mostCompletedThumbnailElement.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <span class="material-icons" style="font-size: 3rem; color: #ccc;">${result.workout.icon || 'fitness_center'}</span>
                </div>
            `;
        }
    }
    
    // Also populate top workout field with the same data
    if (topWorkoutElement) {
        topWorkoutElement.textContent = `"${result.workout.title}"`;
    }
    if (topWorkoutCountElement) {
        topWorkoutCountElement.textContent = result.count;
    }
}

// Add debug toggle functionality
function setupDebugToggle() {
    const toggleBtn = document.getElementById('toggleDebug');
    const forceRefreshBtn = document.getElementById('forceRefresh');
    const debugInfo = document.getElementById('debugInfo');
    
    if (toggleBtn && debugInfo) {
        toggleBtn.addEventListener('click', function() {
            const isHidden = debugInfo.style.display === 'none';
            const storageData = {
                workoutsCount: statsData.workouts.length,
                logsCount: statsData.workoutLogs.length,
                sampleLog: statsData.workoutLogs.length > 0 ? JSON.stringify(statsData.workoutLogs[0], null, 2) : 'No logs found'
            };
            
            // Update debug info with real-time data
            const debugDataElement = document.getElementById('debugData');
            if (!debugDataElement) {
                const dataDiv = document.createElement('div');
                dataDiv.id = 'debugData';
                dataDiv.style.marginTop = '1rem';
                dataDiv.style.fontSize = '0.8rem';
                dataDiv.style.fontFamily = 'monospace';
                dataDiv.style.whiteSpace = 'pre-wrap';
                dataDiv.style.maxHeight = '200px';
                dataDiv.style.overflow = 'auto';
                dataDiv.innerHTML = `<strong>LocalStorage Data:</strong>
- Workouts: ${storageData.workoutsCount}
- Workout Logs: ${storageData.logsCount}`;
                debugInfo.appendChild(dataDiv);
            } else {
                debugDataElement.innerHTML = `<strong>LocalStorage Data:</strong>
- Workouts: ${storageData.workoutsCount}
- Workout Logs: ${storageData.logsCount}`;
            }
            
            // Toggle display
            debugInfo.style.display = isHidden ? 'block' : 'none';
        });
        
        // Keep debug panel hidden by default in production
        debugInfo.style.display = 'none';
    }
    
    // Add force refresh functionality
    if (forceRefreshBtn) {
        forceRefreshBtn.addEventListener('click', function() {
            // Reload data and refresh UI
            loadStatsWorkouts();
            loadStatsWorkoutLogs();
            
            // Update UI
            displayTotalWorkouts();
            displayLongestStreak();
            displayFrequency();
            displayMostCompletedWorkout();
            
            // Show confirmation
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = 'Stats data refreshed!';
            document.body.appendChild(toast);
            
            // Remove toast after 2 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
            
            // Update debug data if visible
            const debugDataElement = document.getElementById('debugData');
            if (debugDataElement) {
                debugDataElement.innerHTML = `<strong>LocalStorage Data:</strong>
- Workouts: ${statsData.workouts.length}
- Workout Logs: ${statsData.workoutLogs.length}

<strong>Raw LocalStorage:</strong>
- 'workouts' key exists: ${localStorage.getItem('workouts') !== null}
- 'workoutLogs' key exists: ${localStorage.getItem('workoutLogs') !== null}
- workoutLogs length: ${localStorage.getItem('workoutLogs') ? JSON.parse(localStorage.getItem('workoutLogs')).length : 0}`;
            }
        });
    }
}

// Share stats functionality
function shareStats() {
    const total = totalWorkoutsElement ? totalWorkoutsElement.textContent : '0';
    const streak = longestStreakElement ? longestStreakElement.textContent : '0';
    const topWorkout = topWorkoutElement ? topWorkoutElement.textContent.replace(/"/g, '') : 'None';
    
    const shareText = `I've completed ${total} workouts on TrainLink with a streak of ${streak} consecutive days! My top workout: ${topWorkout}. #TrainLink #FitnessGoals`;
    
    // Try native share API if available
    if (navigator.share) {
        navigator.share({
            title: 'My TrainLink Stats',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.error('Share failed:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback for sharing
function fallbackShare(text) {
    // Copy to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'Stats copied to clipboard!';
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize the stats page
function initStatsPage() {
    console.log("Stats page: Initializing...");
    
    // Add toast styles
    const style = document.createElement('style');
    style.textContent = `
    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 2rem;
        z-index: 9999;
        transition: opacity 0.3s ease;
    }
    `;
    document.head.appendChild(style);
    
    // Direct check of localStorage
    try {
        console.log("Stats page: Direct check of localStorage");
        const rawWorkouts = localStorage.getItem('workouts');
        const rawLogs = localStorage.getItem('workoutLogs');
        
        console.log(`Stats page: Raw workouts exists: ${rawWorkouts !== null}`);
        console.log(`Stats page: Raw logs exists: ${rawLogs !== null}`);
        
        if (rawLogs) {
            const parsedLogs = JSON.parse(rawLogs);
            console.log(`Stats page: Direct parsed logs count: ${parsedLogs.length}`);
            if (parsedLogs.length > 0) {
                console.log("Stats page: Sample log from direct parse:", parsedLogs[0]);
            }
        }
    } catch (e) {
        console.error("Stats page: Error in direct localStorage check:", e);
    }
    
    // Load data
    loadStatsWorkouts();
    loadStatsWorkoutLogs();
    
    // Wait a short moment to allow DOM to be ready
    setTimeout(() => {
        // Update UI
        displayTotalWorkouts();
        displayLongestStreak();
        displayFrequency();
        displayMostCompletedWorkout();
        
        // Setup debug toggle
        setupDebugToggle();
    }, 100);
    
    // Set up share button functionality
    const shareBtn = document.querySelector('.stats-share-button');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareStats);
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initStatsPage); 