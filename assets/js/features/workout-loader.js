// Import Firebase modules
import { auth } from '../core/firebase-config.js';
import { getUserWorkouts } from '../core/firebase-db.js';

// Variables
let workouts = [];

// Load workouts from localStorage or Firebase
async function loadWorkouts() {
    try {
        // Check if user is logged in
        const user = auth.currentUser;
        
        if (user) {
            console.log("User is logged in. Loading workouts from Firebase...");
            try {
                // Load from Firebase
                workouts = await getUserWorkouts();
                console.log(`Loaded ${workouts.length} workouts from Firebase`);
            } catch (error) {
                console.error("Error loading workouts from Firebase:", error);
                // Log out the user in case of permissions error to force using localStorage
                if (error.message && error.message.includes("Missing or insufficient permissions")) {
                    console.log("Permissions error. Reverting to local storage mode.");
                    // Don't actually sign out, just switch to local storage
                }
                
                // Fallback to localStorage
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
        
        // Render workouts if renderWorkoutCards function exists
        if (typeof window.renderWorkoutCards === 'function') {
            // Update UI
            window.renderWorkoutCards();
            
            // Calculate max scroll if function exists
            if (typeof window.calculateMaxScroll === 'function') {
                window.calculateMaxScroll();
            }
        } else {
            console.warn("renderWorkoutCards function not found on window object");
        }
    } catch (error) {
        console.error("Error in loadWorkouts:", error);
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing workout loader...");
    
    // Set up auth state change listener
    auth.onAuthStateChanged(async (user) => {
        console.log("Auth state changed. User logged in:", !!user);
        await loadWorkouts();
    });
    
    // Initial load
    loadWorkouts();
    
    // Also listen for workout added events
    document.addEventListener('workoutAdded', async () => {
        console.log('Workout added event detected in workout-loader.js');
        await loadWorkouts();
    });
}); 