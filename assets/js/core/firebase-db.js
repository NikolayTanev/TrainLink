import { db, auth } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Collection names
const WORKOUTS_COLLECTION = 'workouts';
const WORKOUT_LOGS_COLLECTION = 'workoutLogs';
const SCHEDULED_WORKOUTS_COLLECTION = 'scheduledWorkouts';

// Create a timestamp function that works with both real and mock Firebase
function getTimestamp() {
    // Check if serverTimestamp is available
    if (typeof serverTimestamp === 'function') {
        return serverTimestamp();
    } else {
        // Fall back to a Date object
        return new Date();
    }
}

/**
 * Save a workout to Firestore
 * @param {Object} workoutData - The workout data to save
 * @returns {Promise<string>} - The ID of the created workout
 */
export async function saveWorkout(workoutData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to save workouts');
        }

        // Add userId to workout data
        const workout = {
            ...workoutData,
            userId: user.uid,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp()
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), workout);
        console.log('Workout saved to Firestore with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving workout to Firestore:', error);
        throw error;
    }
}

/**
 * Get all workouts for the current user
 * @returns {Promise<Array>} - Array of workout objects with IDs
 */
export async function getUserWorkouts() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to get workouts');
        }

        let workoutsQuery;
        
        try {
            // Try to create a proper query first
            workoutsQuery = query(
                collection(db, WORKOUTS_COLLECTION),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
        } catch (error) {
            console.warn('Error creating proper query, falling back to simple collection:', error);
            // Fallback to simple collection if query fails (for mock implementation)
            workoutsQuery = collection(db, WORKOUTS_COLLECTION);
        }

        const querySnapshot = await getDocs(workoutsQuery);
        const workouts = [];
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Only include this user's workouts if we couldn't use a query
            if (workoutsQuery === collection(db, WORKOUTS_COLLECTION)) {
                if (data && data.userId === user.uid) {
                    workouts.push({
                        id: doc.id,
                        ...data
                    });
                }
            } else {
                // If we used a proper query, all results should be for this user
                workouts.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        console.log(`Retrieved ${workouts.length} workouts for user ${user.uid}`);
        return workouts;
    } catch (error) {
        console.error('Error getting user workouts:', error);
        throw error;
    }
}

/**
 * Update a workout in Firestore
 * @param {string} workoutId - The ID of the workout to update
 * @param {Object} workoutData - The updated workout data
 * @returns {Promise<void>}
 */
export async function updateWorkout(workoutId, workoutData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to update workouts');
        }

        // First, check that the workout belongs to the current user
        const workoutRef = doc(db, WORKOUTS_COLLECTION, workoutId);
        const workoutSnap = await getDoc(workoutRef);
        
        if (!workoutSnap.exists) {
            throw new Error('Workout not found');
        }
        
        // In mock implementation, workoutSnap.data might be a property rather than a function
        const workoutDoc = typeof workoutSnap.data === 'function' ? 
            workoutSnap.data() : 
            workoutSnap.data;
            
        if (!workoutDoc) {
            throw new Error('Workout data is missing');
        }
        
        if (workoutDoc.userId !== user.uid) {
            throw new Error('You do not have permission to update this workout');
        }

        // Update the workout
        await updateDoc(workoutRef, {
            ...workoutData,
            updatedAt: getTimestamp()
        });

        console.log('Workout updated in Firestore:', workoutId);
    } catch (error) {
        console.error('Error updating workout:', error);
        throw error;
    }
}

/**
 * Delete a workout from Firestore
 * @param {string} workoutId - The ID of the workout to delete
 * @returns {Promise<void>}
 */
export async function deleteWorkout(workoutId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to delete workouts');
        }

        // First, check that the workout belongs to the current user
        const workoutRef = doc(db, WORKOUTS_COLLECTION, workoutId);
        const workoutSnap = await getDoc(workoutRef);
        
        if (!workoutSnap.exists) {
            throw new Error('Workout not found');
        }
        
        // In mock implementation, workoutSnap.data might be a property rather than a function
        const workoutDoc = typeof workoutSnap.data === 'function' ? 
            workoutSnap.data() : 
            workoutSnap.data;
            
        if (!workoutDoc) {
            throw new Error('Workout data is missing');
        }
        
        if (workoutDoc.userId !== user.uid) {
            throw new Error('You do not have permission to delete this workout');
        }

        // Delete the workout
        await deleteDoc(workoutRef);
        console.log('Workout deleted from Firestore:', workoutId);
    } catch (error) {
        console.error('Error deleting workout:', error);
        throw error;
    }
}

/**
 * Migrate local workouts to Firestore
 * @param {Array} localWorkouts - Array of workout objects from localStorage
 * @returns {Promise<Object>} - Object with mapping from old IDs to new IDs
 */
export async function migrateLocalWorkouts(localWorkouts) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to migrate workouts');
        }

        console.log(`Migrating ${localWorkouts.length} workouts to Firestore...`);
        const idMapping = {};
        
        for (const workout of localWorkouts) {
            // Remove the id from the workout object - Firestore will generate a new one
            const { id, ...workoutData } = workout;
            
            // Save to Firestore and store mapping of old ID to new ID
            const newId = await saveWorkout(workoutData);
            idMapping[id] = newId;
        }

        console.log('Migration complete. ID mapping:', idMapping);
        return idMapping;
    } catch (error) {
        console.error('Error migrating workouts:', error);
        throw error;
    }
}

/**
 * Check if user has any workouts in Firestore
 * @returns {Promise<boolean>} - True if user has workouts, false otherwise
 */
export async function hasUserWorkouts() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return false;
        }

        let workoutsQuery;
        
        try {
            // Try to create a proper query first with limit
            workoutsQuery = query(
                collection(db, WORKOUTS_COLLECTION),
                where('userId', '==', user.uid),
                // Limit to 1 result since we only need to know if any exist
                orderBy('createdAt', 'desc')
            );
        } catch (error) {
            console.warn('Error creating proper query, falling back to simple collection:', error);
            // Fallback to simple collection if query fails (for mock implementation)
            workoutsQuery = collection(db, WORKOUTS_COLLECTION);
        }

        const querySnapshot = await getDocs(workoutsQuery);
        
        // If we used the fallback approach, check if any of the results are for this user
        if (workoutsQuery === collection(db, WORKOUTS_COLLECTION)) {
            let hasUserWorkout = false;
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data && data.userId === user.uid) {
                    hasUserWorkout = true;
                }
            });
            
            return hasUserWorkout;
        }
        
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking for user workouts:', error);
        return false;
    }
}

/**
 * Check if Firebase is properly initialized and accessible
 * @returns {Promise<boolean>} - True if Firebase is ready for use
 */
export async function isFirebaseReady() {
    try {
        // Try a simple operation to see if Firestore is accessible
        const testRef = collection(db, WORKOUTS_COLLECTION);
        await getDocs(testRef);
        return true;
    } catch (error) {
        console.warn('Firebase is not ready or accessible:', error);
        return false;
    }
}

/**
 * Save a workout log to Firestore
 * @param {Object} logData - The workout log data to save
 * @returns {Promise<string>} - The ID of the created log
 */
export async function saveWorkoutLog(logData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to save workout logs');
        }

        // Add userId to log data
        const log = {
            ...logData,
            userId: user.uid,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp()
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, WORKOUT_LOGS_COLLECTION), log);
        console.log('Workout log saved to Firestore with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving workout log to Firestore:', error);
        throw error;
    }
}

/**
 * Get all workout logs for the current user
 * @returns {Promise<Array>} - Array of workout log objects with IDs
 */
export async function getUserWorkoutLogs() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to get workout logs');
        }

        let logsQuery;
        
        try {
            // Try to create a proper query first
            logsQuery = query(
                collection(db, WORKOUT_LOGS_COLLECTION),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
        } catch (error) {
            console.warn('Error creating proper query, falling back to simple collection:', error);
            // Fallback to simple collection if query fails (for mock implementation)
            logsQuery = collection(db, WORKOUT_LOGS_COLLECTION);
        }

        const querySnapshot = await getDocs(logsQuery);
        const logs = [];
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Only include this user's logs if we couldn't use a query
            if (logsQuery === collection(db, WORKOUT_LOGS_COLLECTION)) {
                if (data && data.userId === user.uid) {
                    logs.push({
                        id: doc.id,
                        ...data
                    });
                }
            } else {
                // If we used a proper query, all results should be for this user
                logs.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        console.log(`Retrieved ${logs.length} workout logs for user ${user.uid}`);
        return logs;
    } catch (error) {
        console.error('Error getting user workout logs:', error);
        throw error;
    }
}

/**
 * Update a workout log in Firestore
 * @param {string} logId - The ID of the log to update
 * @param {Object} logData - The updated log data
 * @returns {Promise<void>}
 */
export async function updateWorkoutLog(logId, logData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to update workout logs');
        }

        // First, check that the log belongs to the current user
        const logRef = doc(db, WORKOUT_LOGS_COLLECTION, logId);
        const logSnap = await getDoc(logRef);
        
        if (!logSnap.exists) {
            throw new Error('Workout log not found');
        }
        
        // In mock implementation, logSnap.data might be a property rather than a function
        const logDoc = typeof logSnap.data === 'function' ? 
            logSnap.data() : 
            logSnap.data;
            
        if (!logDoc) {
            throw new Error('Workout log data is missing');
        }
        
        if (logDoc.userId !== user.uid) {
            throw new Error('You do not have permission to update this workout log');
        }

        // Update the log
        await updateDoc(logRef, {
            ...logData,
            updatedAt: getTimestamp()
        });

        console.log('Workout log updated in Firestore:', logId);
    } catch (error) {
        console.error('Error updating workout log:', error);
        throw error;
    }
}

/**
 * Delete a workout log from Firestore
 * @param {string} logId - The ID of the log to delete
 * @returns {Promise<void>}
 */
export async function deleteWorkoutLog(logId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to delete workout logs');
        }

        // First, check that the log belongs to the current user
        const logRef = doc(db, WORKOUT_LOGS_COLLECTION, logId);
        const logSnap = await getDoc(logRef);
        
        if (!logSnap.exists) {
            throw new Error('Workout log not found');
        }
        
        // In mock implementation, logSnap.data might be a property rather than a function
        const logDoc = typeof logSnap.data === 'function' ? 
            logSnap.data() : 
            logSnap.data;
            
        if (!logDoc) {
            throw new Error('Workout log data is missing');
        }
        
        if (logDoc.userId !== user.uid) {
            throw new Error('You do not have permission to delete this workout log');
        }

        // Delete the log
        await deleteDoc(logRef);
        console.log('Workout log deleted from Firestore:', logId);
    } catch (error) {
        console.error('Error deleting workout log:', error);
        throw error;
    }
}

/**
 * Delete a scheduled workout from Firestore
 * @param {string} scheduledWorkoutId - The ID of the scheduled workout to delete
 * @returns {Promise<void>}
 */
export async function deleteScheduledWorkout(scheduledWorkoutId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to delete scheduled workouts');
        }

        // First, check that the scheduled workout belongs to the current user
        const scheduledWorkoutRef = doc(db, SCHEDULED_WORKOUTS_COLLECTION, scheduledWorkoutId);
        const scheduledWorkoutSnap = await getDoc(scheduledWorkoutRef);
        
        if (!scheduledWorkoutSnap.exists) {
            throw new Error('Scheduled workout not found');
        }
        
        // In mock implementation, scheduledWorkoutSnap.data might be a property rather than a function
        const scheduledWorkoutDoc = typeof scheduledWorkoutSnap.data === 'function' ? 
            scheduledWorkoutSnap.data() : 
            scheduledWorkoutSnap.data;
            
        if (!scheduledWorkoutDoc) {
            throw new Error('Scheduled workout data is missing');
        }
        
        if (scheduledWorkoutDoc.userId !== user.uid) {
            throw new Error('You do not have permission to delete this scheduled workout');
        }

        // Delete the scheduled workout
        await deleteDoc(scheduledWorkoutRef);
        console.log('Scheduled workout deleted from Firestore:', scheduledWorkoutId);
    } catch (error) {
        console.error('Error deleting scheduled workout:', error);
        throw error;
    }
}

/**
 * Get all scheduled workouts for the current user
 * @returns {Promise<Array>} - Array of scheduled workout objects
 */
export async function getUserScheduledWorkouts() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to get scheduled workouts');
        }

        console.log(`Fetching scheduled workouts for user ${user.uid} from Firestore collection ${SCHEDULED_WORKOUTS_COLLECTION}`);
        
        // Query Firestore for user's scheduled workouts
        const q = query(
            collection(db, SCHEDULED_WORKOUTS_COLLECTION), 
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        // Process results
        const scheduledWorkouts = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Add the Firestore ID as firebaseId to distinguish from client-generated IDs
            scheduledWorkouts.push({
                ...data,
                firebaseId: doc.id
            });
        });
        
        console.log(`Retrieved ${scheduledWorkouts.length} scheduled workouts for user ${user.uid}`);
        
        // Log all the IDs for debugging
        if (scheduledWorkouts.length > 0) {
            console.log("Scheduled workout IDs:", scheduledWorkouts.map(w => ({
                firebaseId: w.firebaseId,
                id: w.id,
                title: w.title,
                date: w.date
            })));
        }
        
        return scheduledWorkouts;
    } catch (error) {
        console.error('Error getting scheduled workouts from Firestore:', error);
        throw error;
    }
}

/**
 * Save a scheduled workout to Firestore
 * @param {Object} scheduledWorkoutData - The scheduled workout data to save
 * @returns {Promise<string>} - The ID of the created scheduled workout
 */
export async function saveScheduledWorkout(scheduledWorkoutData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to save scheduled workouts');
        }

        // Remove undefined values or replace with null (Firebase doesn't accept undefined)
        const cleanedData = {};
        Object.entries(scheduledWorkoutData).forEach(([key, value]) => {
            cleanedData[key] = value === undefined ? null : value;
        });

        // Add userId to scheduled workout data
        const scheduledWorkout = {
            ...cleanedData,
            userId: user.uid,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp()
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, SCHEDULED_WORKOUTS_COLLECTION), scheduledWorkout);
        console.log('Scheduled workout saved to Firestore with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving scheduled workout to Firestore:', error);
        throw error;
    }
}

/**
 * Update a scheduled workout in Firestore
 * @param {string} scheduledWorkoutId - The ID of the scheduled workout to update
 * @param {Object} scheduledWorkoutData - The updated scheduled workout data
 * @returns {Promise<void>}
 */
export async function updateScheduledWorkout(scheduledWorkoutId, scheduledWorkoutData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to update scheduled workouts');
        }

        // First, check that the scheduled workout belongs to the current user
        const scheduledWorkoutRef = doc(db, SCHEDULED_WORKOUTS_COLLECTION, scheduledWorkoutId);
        const scheduledWorkoutSnap = await getDoc(scheduledWorkoutRef);
        
        if (!scheduledWorkoutSnap.exists) {
            throw new Error('Scheduled workout not found');
        }
        
        // In mock implementation, scheduledWorkoutSnap.data might be a property rather than a function
        const scheduledWorkoutDoc = typeof scheduledWorkoutSnap.data === 'function' ? 
            scheduledWorkoutSnap.data() : 
            scheduledWorkoutSnap.data;
            
        if (!scheduledWorkoutDoc) {
            throw new Error('Scheduled workout data is missing');
        }
        
        if (scheduledWorkoutDoc.userId !== user.uid) {
            throw new Error('You do not have permission to update this scheduled workout');
        }

        // Update the scheduled workout
        await updateDoc(scheduledWorkoutRef, {
            ...scheduledWorkoutData,
            updatedAt: getTimestamp()
        });

        console.log('Scheduled workout updated in Firestore:', scheduledWorkoutId);
    } catch (error) {
        console.error('Error updating scheduled workout:', error);
        throw error;
    }
} 