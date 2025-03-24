// Stats page - Completely standalone version

// Import Firebase modules
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { db } from '../core/firebase-config.js';

// Get auth instance
const auth = getAuth();

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
    workoutLogs: [],
    isUsingFirebase: false
};

// Clear local storage data when logging in/out
function clearLocalData() {
    console.log("Stats page: Clearing local data...");
    statsData.workouts = [];
    statsData.workoutLogs = [];
}

// Load workouts based on auth state
async function loadStatsWorkouts() {
    console.log("Stats page: Loading workouts...");
    clearLocalData();
    
    try {
        // Check if user is logged in
        if (auth.currentUser) {
            console.log("Stats page: User is logged in. Loading workouts from Firebase...");
            statsData.isUsingFirebase = true;
            
            const workoutsRef = collection(db, 'workouts');
            const q = query(workoutsRef, where('userId', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(q);
            statsData.workouts = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            console.log(`Stats page: Loaded ${statsData.workouts.length} workouts from Firebase`);
        } else {
            console.log("Stats page: User not logged in. Loading workouts from localStorage...");
            statsData.isUsingFirebase = false;
            
            const storedWorkouts = localStorage.getItem('workouts');
            statsData.workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            console.log(`Stats page: Loaded ${statsData.workouts.length} workouts from localStorage`);
        }
    } catch (error) {
        console.error("Stats page: Error loading workouts:", error);
        if (!statsData.isUsingFirebase) {
            // Only fall back to localStorage if we weren't trying to use Firebase
            try {
                const storedWorkouts = localStorage.getItem('workouts');
                statsData.workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            } catch (e) {
                console.error("Stats page: Error loading from localStorage:", e);
                statsData.workouts = [];
            }
        }
    }
}

// Load workout logs based on auth state
async function loadStatsWorkoutLogs() {
    console.log("Stats page: Loading workout logs...");
    
    try {
        const user = auth.currentUser;
        
        if (user) {
            console.log("Stats page: User is logged in. Loading workout logs from Firebase...");
            statsData.isUsingFirebase = true;
            
            try {
                const logsRef = collection(db, 'workoutLogs');
                const q = query(logsRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
                statsData.workoutLogs = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Convert Firestore Timestamp to Date
                        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
                    };
                });
                
                console.log(`Stats page: Loaded ${statsData.workoutLogs.length} workout logs from Firebase`);
            } catch (error) {
                console.error("Stats page: Error loading workout logs from Firebase:", error);
                statsData.workoutLogs = [];
            }
        } else {
            // User is not logged in, use localStorage
            console.log("Stats page: User not logged in. Loading workout logs from localStorage...");
            statsData.isUsingFirebase = false;
            
            const storedLogs = localStorage.getItem('workoutLogs');
            statsData.workoutLogs = storedLogs ? JSON.parse(storedLogs) : [];
            console.log(`Stats page: Loaded ${statsData.workoutLogs.length} workout logs from localStorage`);
        }
        
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
    
    const recentLogs = statsData.workoutLogs.filter(log => {
        if (!log || !log.date) return false;
        const logDate = new Date(log.date);
        return logDate >= fourWeeksAgo;
    });
    
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
    
    // Count completions per workout and store workout data
    const completionCount = {};
    const workoutData = {};
    
    statsData.workoutLogs.forEach((log, index) => {
        // Ensure the log has a workout
        if (log && log.workout) {
            // Get workout ID - handle both string and object formats
            const workoutId = typeof log.workout === 'string' ? log.workout : log.workout.id;
            if (workoutId) {
                completionCount[workoutId] = (completionCount[workoutId] || 0) + 1;
                // Store the workout data from the log if we don't have it yet
                if (!workoutData[workoutId] && log.workout && typeof log.workout === 'object') {
                    workoutData[workoutId] = log.workout;
                }
            }
        } else {
            console.warn(`Stats page: Invalid workout log at index ${index}:`, log);
        }
    });
    
    console.log("Stats page: Workout completion counts:", completionCount);
    console.log("Stats page: Workout data from logs:", workoutData);
    
    // Find the workout with the highest count
    let maxCount = 0;
    let mostCompletedId = null;
    
    Object.entries(completionCount).forEach(([id, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostCompletedId = id;
        }
    });
    
    // If no completions were found, return null
    if (!mostCompletedId) {
        console.log("Stats page: No completed workouts found");
        return null;
    }
    
    // Try to get the workout data in this order:
    // 1. From workouts array (Firebase/localStorage)
    // 2. From workout data stored in logs
    // 3. Create a basic workout object with just the ID
    let mostCompleted = statsData.workouts.find(w => w && (w.id === mostCompletedId || w.id.toString() === mostCompletedId));
    
    if (!mostCompleted) {
        console.log(`Stats page: Could not find workout with ID ${mostCompletedId} in workouts array, checking logs...`);
        mostCompleted = workoutData[mostCompletedId];
        
        if (!mostCompleted) {
            console.log(`Stats page: Could not find workout data in logs, creating basic workout object`);
            mostCompleted = {
                id: mostCompletedId,
                title: "Unknown Workout",
                icon: "fitness_center"
            };
        }
    }
    
    console.log(`Stats page: Most completed workout:`, mostCompleted, `(${maxCount} times)`);
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
            mostCompletedThumbnailElement.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <span class="material-icons" style="font-size: 3rem; color: #ccc;">fitness_center</span>
                </div>
            `;
        }
        if (topWorkoutElement) {
            topWorkoutElement.textContent = '"NONE"';
        }
        if (topWorkoutCountElement) {
            topWorkoutCountElement.textContent = '0';
        }
        return;
    }
    
    const workout = result.workout;
    const title = workout.title || "Unknown Workout";
    
    if (mostCompletedWorkoutTitleElement) {
        mostCompletedWorkoutTitleElement.textContent = `"${title}"`;
    }
    if (mostCompletedCountElement) {
        mostCompletedCountElement.textContent = result.count;
    }
    
    // Display the thumbnail if available
    if (mostCompletedThumbnailElement) {
        if (workout.video && workout.video.thumbnail) {
            mostCompletedThumbnailElement.innerHTML = `
                <img src="${workout.video.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">
            `;
        } else {
            // Display icon if no thumbnail
            mostCompletedThumbnailElement.innerHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <span class="material-icons" style="font-size: 3rem; color: #ccc;">${workout.icon || 'fitness_center'}</span>
                </div>
            `;
        }
    }
    
    // Also populate top workout field with the same data
    if (topWorkoutElement) {
        topWorkoutElement.textContent = `"${title}"`;
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
                dataDiv.innerHTML = `<strong>Data Summary:</strong>
- Workouts: ${storageData.workoutsCount}
- Workout Logs: ${storageData.logsCount}
- Firebase User: ${auth.currentUser ? auth.currentUser.email : 'Not logged in'}

<strong>Sample Log Entry:</strong>
${storageData.sampleLog}`;
                debugInfo.appendChild(dataDiv);
            } else {
                debugDataElement.innerHTML = `<strong>Data Summary:</strong>
- Workouts: ${storageData.workoutsCount}
- Workout Logs: ${storageData.logsCount}
- Firebase User: ${auth.currentUser ? auth.currentUser.email : 'Not logged in'}

<strong>Sample Log Entry:</strong>
${storageData.sampleLog}`;
            }
            
            // Toggle display
            debugInfo.style.display = isHidden ? 'block' : 'none';
        });
        
        // Keep debug panel hidden by default in production
        debugInfo.style.display = 'none';
    }
    
    // Add force refresh functionality
    if (forceRefreshBtn) {
        forceRefreshBtn.addEventListener('click', async function() {
            // Reload data and refresh UI
            await loadStatsWorkouts();
            await loadStatsWorkoutLogs();
            
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
                debugDataElement.innerHTML = `<strong>Data Summary:</strong>
- Workouts: ${statsData.workouts.length}
- Workout Logs: ${statsData.workoutLogs.length}
- Firebase User: ${auth.currentUser ? auth.currentUser.email : 'Not logged in'}

<strong>Sample Log Entry:</strong>
${statsData.workoutLogs.length > 0 ? JSON.stringify(statsData.workoutLogs[0], null, 2) : 'No logs found'}`;
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
async function initStatsPage() {
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
    
    try {
        // Set up auth state change listener
        auth.onAuthStateChanged(async (user) => {
            console.log("Stats page: Auth state changed. User logged in:", !!user);
            
            // Clear existing data
            clearLocalData();
            
            // Load new data based on auth state
            await Promise.all([
                loadStatsWorkouts(),
                loadStatsWorkoutLogs()
            ]);
            
            // Update UI
            displayTotalWorkouts();
            displayLongestStreak();
            displayFrequency();
            displayMostCompletedWorkout();
        });
        
        // Setup debug toggle
        setupDebugToggle();
        
        // Set up share button functionality
        const shareBtn = document.querySelector('.stats-share-button');
        if (shareBtn) {
            shareBtn.addEventListener('click', shareStats);
        }
    } catch (error) {
        console.error("Stats page: Error during initialization:", error);
        // Show error message to user
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = 'Error loading stats. Please try refreshing the page.';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initStatsPage); 