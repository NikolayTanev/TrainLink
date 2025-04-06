import { 
    auth, 
    getCurrentUser, 
    db, 
    sendPasswordReset,
    initAuthStateObserver
} from '../core/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc,
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { updateProfile, deleteUser } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Import necessary functions to get workout data
import { getUserWorkoutLogs, getUserWorkouts } from '../core/firebase-db.js';

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    // Use auth state observer instead of direct check
    initAuthStateObserver((user) => {
        if (user) {
            // Load user data
            loadUserData(user);
            
            // Load user stats
            loadUserStats(user);
            
            // Set up event listeners
            setupEventListeners(user);
        } else {
            // Redirect to login only if not in the process of authentication
            // This prevents unnecessary redirects when the auth state is still being determined
            setTimeout(() => {
                if (!auth.currentUser) {
                    window.location.href = '../pages/login.html';
                }
            }, 1000); // Short delay to allow auth to initialize
        }
    });
});

// Load user profile data
async function loadUserData(user) {
    const userEmail = document.getElementById('userEmail');
    const displayName = document.getElementById('displayName');
    const accountCreated = document.getElementById('accountCreated');
    const displayNameInput = document.getElementById('displayNameInput');
    const emailInput = document.getElementById('emailInput');
    
    if (userEmail) userEmail.textContent = user.email;
    if (emailInput) emailInput.value = user.email;
    
    // Set display name
    if (user.displayName) {
        if (displayName) displayName.textContent = user.displayName;
        if (displayNameInput) displayNameInput.value = user.displayName;
    } else {
        if (displayName) displayName.textContent = 'User';
        if (displayNameInput) displayNameInput.value = '';
    }
    
    // Set account creation date
    if (user.metadata && user.metadata.creationTime) {
        const creationDate = new Date(user.metadata.creationTime);
        const formattedDate = creationDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        if (accountCreated) accountCreated.textContent = `Member since: ${formattedDate}`;
    }
}

// Load user workout statistics
async function loadUserStats(user) {
    try {
        const totalWorkoutsElement = document.getElementById('totalWorkouts');
        const activeDaysElement = document.getElementById('activeDays');
        const favoriteWorkoutElement = document.getElementById('favoriteWorkout');
        const totalTimeElement = document.getElementById('totalTime');
        
        // First try to get completed workouts from Firebase
        let workoutLogs = [];
        let workouts = [];
        
        try {
            // Direct Firestore query instead of using helper function
            if (db) {
                const workoutLogsRef = collection(db, 'workoutLogs');
                const q = query(workoutLogsRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        workoutLogs.push({
                            id: doc.id,
                            ...data
                        });
                    });
                    console.log(`Retrieved ${workoutLogs.length} workout logs from Firestore`);
                }
                
                // Get workouts
                const workoutsRef = collection(db, 'workouts');
                const workoutsQuery = query(workoutsRef, where('userId', '==', user.uid));
                const workoutsSnapshot = await getDocs(workoutsQuery);
                
                if (!workoutsSnapshot.empty) {
                    workoutsSnapshot.forEach(doc => {
                        const data = doc.data();
                        workouts.push({
                            id: doc.id,
                            ...data
                        });
                    });
                    console.log(`Retrieved ${workouts.length} workouts from Firestore`);
                }
            }
        } catch (error) {
            console.error('Error loading from Firebase, trying localStorage:', error);
        }
        
        // If Firebase query failed or returned no data, try localStorage
        if (workoutLogs.length === 0) {
            try {
                const storedLogs = localStorage.getItem('workoutLogs');
                if (storedLogs) {
                    workoutLogs = JSON.parse(storedLogs);
                    console.log(`Retrieved ${workoutLogs.length} workout logs from localStorage`);
                }
                
                const storedWorkouts = localStorage.getItem('workouts');
                if (storedWorkouts) {
                    workouts = JSON.parse(storedWorkouts);
                    console.log(`Retrieved ${workouts.length} workouts from localStorage`);
                }
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }
        
        // If we still have no data, leave defaults and exit
        if (workoutLogs.length === 0) {
            console.log('No workout data found');
            return;
        }
        
        // Calculate stats
        const workoutDays = new Set();
        const workoutCounts = {};
        let totalMinutes = 0;
        
        workoutLogs.forEach(log => {
            // Skip invalid logs
            if (!log) return;
            
            // Track unique days - handle different date formats
            let workoutDate;
            
            if (log.date) {
                workoutDate = new Date(log.date);
            } else if (log.completedAt) {
                if (typeof log.completedAt === 'object' && log.completedAt !== null && typeof log.completedAt.toDate === 'function') {
                    // Firebase Timestamp object
                    workoutDate = log.completedAt.toDate();
                } else if (typeof log.completedAt === 'string') {
                    // ISO string
                    workoutDate = new Date(log.completedAt);
                } else {
                    // Unknown format, use current date as fallback
                    console.warn('Unknown date format:', log.completedAt);
                    workoutDate = new Date();
                }
            } else {
                // No date information, use current date as fallback
                workoutDate = new Date();
            }
            
            // Only proceed if we have a valid date
            if (workoutDate && !isNaN(workoutDate.getTime())) {
                const dateString = workoutDate.toISOString().split('T')[0];
                workoutDays.add(dateString);
            }
            
            // Count each workout type
            if (log.workoutId) {
                workoutCounts[log.workoutId] = (workoutCounts[log.workoutId] || 0) + 1;
            }
            
            // Add duration - handle different formats
            let duration = 0;
            
            if (log.workout && log.workout.duration) {
                const durationStr = String(log.workout.duration).replace(/\D+/g, '');
                duration = parseInt(durationStr);
            } else if (log.duration) {
                const durationStr = String(log.duration).replace(/\D+/g, '');
                duration = parseInt(durationStr);
            }
            
            if (!isNaN(duration)) {
                totalMinutes += duration;
            }
        });
        
        // Update UI
        if (totalWorkoutsElement) totalWorkoutsElement.textContent = workoutLogs.length;
        if (activeDaysElement) activeDaysElement.textContent = workoutDays.size;
        
        // Find favorite workout
        if (favoriteWorkoutElement && Object.keys(workoutCounts).length > 0) {
            // Get the most frequently completed workout
            const favoriteWorkoutId = Object.keys(workoutCounts).reduce((a, b) => 
                workoutCounts[a] > workoutCounts[b] ? a : b
            );
            
            // Try to get workout name
            let favoriteWorkoutName = 'Unknown';
            
            // First check if it's in the workouts array
            const foundWorkout = workouts.find(w => w && w.id === favoriteWorkoutId);
            if (foundWorkout && foundWorkout.title) {
                favoriteWorkoutName = foundWorkout.title;
            } else {
                // Check workoutLogs if the workout details are embedded there
                const logWithWorkout = workoutLogs.find(log => 
                    log && log.workoutId === favoriteWorkoutId && log.workout && log.workout.title
                );
                if (logWithWorkout && logWithWorkout.workout) {
                    favoriteWorkoutName = logWithWorkout.workout.title || 'Unknown';
                }
            }
            
            favoriteWorkoutElement.textContent = favoriteWorkoutName;
        } else if (favoriteWorkoutElement) {
            favoriteWorkoutElement.textContent = 'None';
        }
        
        // Format total time
        if (totalTimeElement) {
            if (totalMinutes === 0) {
                totalTimeElement.textContent = '0 min';
            } else if (totalMinutes < 60) {
                totalTimeElement.textContent = `${totalMinutes} min`;
            } else {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                totalTimeElement.textContent = `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
            }
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        // In case of error, leave the default values
    }
}

// Set up event listeners
function setupEventListeners(user) {
    const saveProfileButton = document.getElementById('saveProfileButton');
    const changePasswordButton = document.getElementById('changePasswordButton');
    const exportDataButton = document.getElementById('exportDataButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    
    // Save profile changes
    if (saveProfileButton) {
        saveProfileButton.addEventListener('click', async () => {
            const displayNameInput = document.getElementById('displayNameInput');
            const newDisplayName = displayNameInput.value.trim();
            
            try {
                if (newDisplayName !== user.displayName) {
                    // Update profile in Firebase Auth
                    await updateProfile(auth.currentUser, {
                        displayName: newDisplayName
                    });
                    
                    // Update UI
                    document.getElementById('displayName').textContent = newDisplayName || 'User';
                    
                    showSuccessMessage('Profile updated successfully!');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showErrorMessage('Failed to update profile. Please try again.');
            }
        });
    }
    
    // Change password
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', async () => {
            try {
                await sendPasswordReset(user.email);
                showSuccessMessage('Password reset email sent!');
            } catch (error) {
                console.error('Error sending password reset:', error);
                showErrorMessage('Failed to send password reset email. Please try again.');
            }
        });
    }
    
    // Export user data
    if (exportDataButton) {
        exportDataButton.addEventListener('click', async () => {
            try {
                // Get user data
                const userData = {
                    profile: {
                        email: user.email,
                        displayName: user.displayName,
                        createdAt: user.metadata?.creationTime
                    },
                    workouts: []
                };
                
                // Get workout logs
                const workoutLogsRef = collection(db, 'workoutLogs');
                const q = query(workoutLogsRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
                querySnapshot.forEach(doc => {
                    const workout = doc.data();
                    
                    // Convert Firebase timestamp to string
                    if (workout.completedAt) {
                        workout.completedAt = workout.completedAt.toDate().toISOString();
                    }
                    
                    userData.workouts.push(workout);
                });
                
                // Create and download JSON file
                const dataStr = JSON.stringify(userData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `trainlink_data_${user.uid}.json`;
                link.click();
                
                URL.revokeObjectURL(url);
                
                showSuccessMessage('Data export complete!');
            } catch (error) {
                console.error('Error exporting data:', error);
                showErrorMessage('Failed to export data. Please try again.');
            }
        });
    }
    
    // Delete account
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', async () => {
            // Ask for confirmation
            const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
            
            if (!confirmed) return;
            
            try {
                // Get user workouts
                const workoutLogsRef = collection(db, 'workoutLogs');
                const q = query(workoutLogsRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
                // Delete workout logs
                const deletePromises = [];
                querySnapshot.forEach(doc => {
                    deletePromises.push(deleteDoc(doc.ref));
                });
                
                // Wait for all deletions to complete
                await Promise.all(deletePromises);
                
                // Delete user account
                await deleteUser(auth.currentUser);
                
                // Redirect to home page
                window.location.href = '../pages/index.html';
            } catch (error) {
                console.error('Error deleting account:', error);
                showErrorMessage('Failed to delete account. Please try again.');
            }
        });
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `
        <span class="material-icons">check_circle</span>
        ${message}
    `;
    
    // Add to body
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.style.backgroundColor = '#f44336'; // Red background for errors
    messageDiv.innerHTML = `
        <span class="material-icons">error</span>
        ${message}
    `;
    
    // Add to body
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
} 