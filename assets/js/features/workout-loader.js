// Import Firebase modules
import { auth } from '../core/firebase-config.js';
import { getUserWorkouts } from '../core/firebase-db.js';

// Variables
let workouts = [];
let workoutsLoaded = false;
let loadingWorkouts = false;

// Load workouts from localStorage or Firebase
async function loadWorkouts() {
    // Prevent multiple simultaneous loading attempts
    if (loadingWorkouts) {
        console.log("Already loading workouts, waiting...");
        return workouts;
    }

    loadingWorkouts = true;
    
    try {
        // Check if user is logged in
        const user = auth.currentUser;
        
        if (user) {
            console.log("User is logged in. Loading workouts from Firebase...");
            try {
                // Load from Firebase - don't update UI until this completes
                const firebaseWorkouts = await getUserWorkouts();
                workouts = firebaseWorkouts;
                console.log(`Loaded ${workouts.length} workouts from Firebase`);
                
                // Don't use localStorage as fallback when user is logged in
                // This prevents the UI flicker when switching from localStorage to Firebase
            } catch (error) {
                console.error("Error loading workouts from Firebase:", error);
                // Log out the user in case of permissions error to force using localStorage
                if (error.message && error.message.includes("Missing or insufficient permissions")) {
                    console.log("Permissions error. Reverting to local storage mode.");
                    // Don't actually sign out, just switch to local storage
                }
                
                // Fallback to localStorage only if Firebase load fails
                const storedWorkouts = localStorage.getItem('workouts');
                workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
                console.log(`Fallback: Loaded ${workouts.length} workouts from localStorage`);
            }
        } else {
            console.log("User not logged in. Loading workouts from localStorage...");
            // Load from localStorage
            const storedWorkouts = localStorage.getItem('workouts');
            workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            console.log(`Loaded ${workouts.length} workouts from localStorage`);
        }
        
        // Ensure workouts is available in the window object
        window.workouts = workouts;
        workoutsLoaded = true;
        
        // Return the loaded workouts
        return workouts;
    } catch (error) {
        console.error("Error in loadWorkouts:", error);
        return [];
    } finally {
        loadingWorkouts = false;
    }
}

// Export the workouts array and load function
export { workouts, loadWorkouts, workoutsLoaded };

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing workout loader...");
    
    // Set up auth state change listener
    auth.onAuthStateChanged(async (user) => {
        console.log("Auth state changed in workout-loader. User logged in:", !!user);
        if (user) {
            // Only load workouts if user is logged in
            await loadWorkouts();
        }
        // Don't do anything if user is not logged in - the page will handle redirects
    });
    
    // Only do initial load if already logged in
    if (auth.currentUser) {
        loadWorkouts();
    }
    
    // Also listen for workout added events
    document.addEventListener('workoutAdded', async (event) => {
        console.log('Workout added event detected in workout-loader.js');
        
        // Check if the event contains a workout object
        const newWorkout = event.detail && event.detail.workout ? event.detail.workout : null;
        
        if (newWorkout && auth.currentUser) {
            console.log('New workout data available:', newWorkout);
            
            // Process the workout to ensure it has complete video data
            const processedWorkout = processWorkoutData(newWorkout);
            
            // Add workout to local array if it's not already there
            const existingIndex = workouts.findIndex(w => w.id === processedWorkout.id);
            if (existingIndex === -1) {
                workouts.push(processedWorkout);
                console.log('Added new workout to workouts array in workout-loader');
            } else {
                console.log('Workout already exists in workout-loader array, updating it');
                workouts[existingIndex] = processedWorkout;
            }
            
            // Make sure workouts are available in window object
            window.workouts = workouts;
        } else {
            // If no workout data or not logged in, do a full reload
            await loadWorkouts();
        }
    });
    
    // Helper function to process workout data and ensure video info is complete
    function processWorkoutData(workout) {
        if (!workout) return workout;
        
        // Create a copy to avoid modifying the original
        const processed = {...workout};
        
        // If workout has videoUrl but no video object or incomplete video data
        if (processed.videoUrl && (!processed.video || !processed.video.thumbnail)) {
            // Extract YouTube video ID
            const videoId = getYoutubeVideoId(processed.videoUrl);
            if (videoId) {
                processed.video = {
                    type: 'youtube',
                    url: processed.videoUrl,
                    title: processed.videoTitle || processed.title,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                };
                console.log('Workout-loader: Added video data to workout:', processed.title);
            }
        }
        
        return processed;
    }
    
    // Helper function to extract YouTube video ID
    function getYoutubeVideoId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
}); 