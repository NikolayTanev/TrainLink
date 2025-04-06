// Workout sharing functionality
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDoc, 
    setDoc, 
    doc, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db } from '../core/firebase-config.js';
import { getCurrentUser } from '../core/firebase-config.js';

// Collection name for shared workouts
const SHARED_WORKOUTS_COLLECTION = 'sharedWorkouts';

/**
 * Generate a sharing code for a workout or routine
 * @param {string} workoutId - ID of the workout to share (null if sharing a routine)
 * @param {boolean} isRoutine - Whether this is a full routine (multiple workouts)
 * @param {Array} routineWorkouts - Array of workout IDs if sharing a routine
 * @returns {Promise<string>} - The generated sharing code
 */
export async function generateSharingCode(workoutId, isRoutine = false, routineWorkouts = []) {
    try {
        console.log('Generating sharing code for:', isRoutine ? 'routine' : 'workout', workoutId || routineWorkouts);
        
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to share workouts');
        }

        // Create share data object
        const shareData = {
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            isRoutine: isRoutine,
            workoutId: isRoutine ? null : workoutId,
            routineWorkouts: isRoutine ? routineWorkouts : [],
            accessCount: 0,
            lastAccessed: null
        };

        // Save to Firestore in sharedWorkouts collection
        const shareRef = await addDoc(collection(db, SHARED_WORKOUTS_COLLECTION), shareData);
        
        // Use the document ID as the share code
        const shareCode = shareRef.id;
        console.log('Sharing code generated:', shareCode);
        
        return shareCode;
    } catch (error) {
        console.error('Error generating sharing code:', error);
        throw error;
    }
}

/**
 * Get the URL for sharing a workout or routine
 * @param {string} shareCode - The sharing code
 * @returns {string} - The sharing URL
 */
export function getSharingUrl(shareCode) {
    console.log('Creating sharing URL for code:', shareCode);
    
    // Handle both local development and production environments
    const baseUrl = window.location.origin;
    
    // Check if we're in a development environment (localhost or 127.0.0.1)
    const isDevelopment = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    
    // In development we need the /TrainLink/ prefix, in production we don't
    const sharePath = isDevelopment ? '/TrainLink/pages/shared-workout.html' : '/pages/shared-workout.html';
    
    const shareUrl = `${baseUrl}${sharePath}?code=${shareCode}`;
    console.log('Generated share URL:', shareUrl);
    
    return shareUrl;
}

/**
 * Copy the sharing URL to the clipboard
 * @param {string} url - The URL to copy
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export async function copyToClipboard(url) {
    try {
        await navigator.clipboard.writeText(url);
        console.log('Copied to clipboard:', url);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        
        // Fallback method for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';  // Prevent scrolling to bottom
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            console.error('Fallback clipboard copy failed:', err);
            document.body.removeChild(textarea);
            return false;
        }
    }
}

/**
 * Retrieve shared workout data
 * @param {string} shareCode - The sharing code
 * @returns {Promise<Object>} - The shared workout data
 */
export async function getSharedWorkoutData(shareCode) {
    try {
        console.log('Fetching shared workout with code:', shareCode);
        
        // Check if code exists
        const shareDocRef = doc(db, SHARED_WORKOUTS_COLLECTION, shareCode);
        const shareDoc = await getDoc(shareDocRef);
        
        if (!shareDoc.exists()) {
            throw new Error('Shared workout not found');
        }
        
        // Get the share data
        const shareData = shareDoc.data();
        console.log('Shared workout data:', shareData);
        
        // Update access statistics
        await setDoc(shareDocRef, {
            accessCount: (shareData.accessCount || 0) + 1,
            lastAccessed: new Date().toISOString()
        }, { merge: true });
        
        return shareData;
    } catch (error) {
        console.error('Error fetching shared workout:', error);
        throw error;
    }
}

/**
 * Import a shared workout to the current user's workouts
 * @param {string} shareCode - The sharing code
 * @returns {Promise<Object>} - The imported workout(s)
 */
export async function importSharedWorkout(shareCode) {
    try {
        console.log('Importing shared workout:', shareCode);
        
        const user = auth.currentUser;
        if (!user) {
            console.error('User not logged in');
            throw new Error('User must be logged in to import workouts');
        }
        
        console.log('User is logged in:', user.uid);
        
        // 1. Get the shared workout data
        console.log('Fetching shared workout data...');
        const shareData = await getSharedWorkoutData(shareCode);
        
        if (!shareData) {
            console.error('No share data found');
            throw new Error('Shared workout not found');
        }
        
        console.log('Share data retrieved:', shareData);
        
        const importedItems = [];
        const missingWorkouts = [];
        
        // 2. Import based on whether it's a routine or single workout
        if (shareData.isRoutine) {
            console.log('Importing routine with workouts:', shareData.routineWorkouts);
            // Handle routine (multiple workouts)
            if (!shareData.routineWorkouts || shareData.routineWorkouts.length === 0) {
                console.error('Routine has no workouts');
                throw new Error('No workouts found in this routine');
            }
            
            for (const workoutId of shareData.routineWorkouts) {
                try {
                    console.log('Importing workout ID:', workoutId);
                    // First try to get from workouts collection
                    const workoutsRef = collection(db, 'workouts');
                    const q = query(workoutsRef, where("workoutId", "==", workoutId));
                    console.log('Executing query for workout');
                    let querySnapshot = await getDocs(q);
                    
                    // If not found, try searching by originalWorkoutId
                    if (querySnapshot.empty) {
                        console.log('Workout not found by workoutId, trying originalWorkoutId');
                        const q2 = query(workoutsRef, where("originalWorkoutId", "==", workoutId));
                        querySnapshot = await getDocs(q2);
                    }
                    
                    // If still not found, try scheduledWorkouts collection
                    if (querySnapshot.empty) {
                        console.log('Workout not found in workouts collection, trying scheduledWorkouts');
                        const scheduledWorkoutsRef = collection(db, 'scheduledWorkouts');
                        const q3 = query(scheduledWorkoutsRef, where("workoutId", "==", workoutId));
                        querySnapshot = await getDocs(q3);
                        
                        if (querySnapshot.empty) {
                            const q4 = query(scheduledWorkoutsRef, where("originalWorkoutId", "==", workoutId));
                            querySnapshot = await getDocs(q4);
                        }
                    }
                    
                    if (!querySnapshot.empty) {
                        console.log('Workout found, creating copy');
                        const workoutData = querySnapshot.docs[0].data();
                        
                        // Normalize workout data (handle differences between collections)
                        const normalizedWorkout = normalizeWorkoutData(workoutData, workoutId);
                        
                        // Create a new copy for the current user
                        const newWorkout = {
                            ...normalizedWorkout,
                            userId: user.uid,
                            importedFrom: shareCode,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        
                        // Remove the original ID to get a new one
                        delete newWorkout.id;
                        
                        // Save to Firestore
                        console.log('Saving workout to Firestore');
                        const newWorkoutRef = await addDoc(collection(db, 'workouts'), newWorkout);
                        
                        // Add imported workout to the list
                        importedItems.push({
                            id: newWorkoutRef.id,
                            title: workoutData.title
                        });
                        console.log('Workout imported successfully');
                    } else {
                        console.error('Workout not found in database:', workoutId);
                        missingWorkouts.push(workoutId);
                    }
                } catch (error) {
                    console.error(`Error importing workout ${workoutId}:`, error);
                    missingWorkouts.push(workoutId);
                }
            }
            
            // For routines, we'll continue even if some workouts are missing
            if (importedItems.length === 0 && missingWorkouts.length > 0) {
                console.error('None of the workouts in the routine could be imported');
                throw new Error('No workouts could be imported from this routine');
            } else if (missingWorkouts.length > 0) {
                console.warn(`${missingWorkouts.length} workout(s) could not be imported from the routine`);
            }
            
        } else {
            // Handle single workout
            if (shareData.workoutId) {
                console.log('Importing single workout:', shareData.workoutId);
                try {
                    // First try to get from workouts collection
                    const workoutsRef = collection(db, 'workouts');
                    const q = query(workoutsRef, where("workoutId", "==", shareData.workoutId));
                    console.log('Executing query for workout');
                    let querySnapshot = await getDocs(q);
                    
                    // If not found, try searching by originalWorkoutId
                    if (querySnapshot.empty) {
                        console.log('Workout not found by workoutId, trying originalWorkoutId');
                        const q2 = query(workoutsRef, where("originalWorkoutId", "==", shareData.workoutId));
                        querySnapshot = await getDocs(q2);
                    }
                    
                    // If still not found, try scheduledWorkouts collection
                    if (querySnapshot.empty) {
                        console.log('Workout not found in workouts collection, trying scheduledWorkouts');
                        const scheduledWorkoutsRef = collection(db, 'scheduledWorkouts');
                        const q3 = query(scheduledWorkoutsRef, where("workoutId", "==", shareData.workoutId));
                        querySnapshot = await getDocs(q3);
                        
                        if (querySnapshot.empty) {
                            const q4 = query(scheduledWorkoutsRef, where("originalWorkoutId", "==", shareData.workoutId));
                            querySnapshot = await getDocs(q4);
                        }
                    }
                    
                    if (!querySnapshot.empty) {
                        console.log('Workout found, creating copy');
                        const workoutData = querySnapshot.docs[0].data();
                        
                        // Normalize workout data (handle differences between collections)
                        const normalizedWorkout = normalizeWorkoutData(workoutData, shareData.workoutId);
                        
                        // Create a new copy for the current user
                        const newWorkout = {
                            ...normalizedWorkout,
                            userId: user.uid,
                            importedFrom: shareCode,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        
                        // Remove the original ID to get a new one
                        delete newWorkout.id;
                        
                        // Save to Firestore
                        console.log('Saving workout to Firestore');
                        const newWorkoutRef = await addDoc(collection(db, 'workouts'), newWorkout);
                        
                        // Add imported workout to the list
                        importedItems.push({
                            id: newWorkoutRef.id,
                            title: workoutData.title
                        });
                        console.log('Workout imported successfully');
                    } else {
                        console.error('Workout not found in database:', shareData.workoutId);
                        throw new Error(`Workout with ID ${shareData.workoutId} not found`);
                    }
                } catch (error) {
                    console.error(`Error importing workout ${shareData.workoutId}:`, error);
                    throw error; // Re-throw for single workout import
                }
            } else {
                console.error('No workout ID found in share data');
                throw new Error('No workout ID found in share data');
            }
        }
        
        console.log('Successfully imported workouts:', importedItems);
        return importedItems;
    } catch (error) {
        console.error('Error importing shared workout:', error);
        throw error;
    }
}

/**
 * Show the share workout dialog
 * @param {string|null} workoutId - The ID of the workout to share (null for multiple workouts)
 * @param {boolean} isRoutine - Whether this is a full routine (multiple workouts)
 * @param {Array} routineWorkouts - Array of workout IDs if sharing a routine
 */
export function showShareWorkoutDialog(workoutId, isRoutine = false, routineWorkouts = []) {
    try {
        console.log('Showing share dialog for:', isRoutine ? 'routine' : 'workout', workoutId || routineWorkouts);
        console.log('Current DOM body:', document.body.innerHTML.substring(0, 100) + '...');
        
        // Create or get the share dialog element
        let shareDialog = document.getElementById('shareWorkoutDialog');
        
        if (!shareDialog) {
            console.log('Creating new share dialog element');
            shareDialog = document.createElement('div');
            shareDialog.id = 'shareWorkoutDialog';
            shareDialog.className = 'dialog-overlay';
            document.body.appendChild(shareDialog);
            console.log('Share dialog element created and appended to body');
        } else {
            console.log('Using existing share dialog element');
        }
        
        // Set dialog content
        console.log('Setting dialog content');
        shareDialog.innerHTML = `
            <div class="share-workout-dialog">
                <h2>${isRoutine ? 'Share Routine' : 'Share Workout'}</h2>
                <button class="close-button" aria-label="Close dialog">
                    <span class="material-icons">close</span>
                </button>
                
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>Generating sharing link...</p>
                </div>
                
                <div class="share-link-container" style="display: none;">
                    <p>Share this link with anyone you want to share your ${isRoutine ? 'routine' : 'workout'} with:</p>
                    <div class="share-url-container">
                        <input type="text" id="shareUrlInput" readonly>
                        <button class="copy-button" id="copyShareUrl" aria-label="Copy to clipboard">
                            <span class="material-icons">content_copy</span>
                            Copy
                        </button>
                    </div>
                    <div id="copyConfirmation" class="copy-confirmation" style="display: none;">
                        <span class="material-icons">check_circle</span>
                        Link copied to clipboard!
                    </div>
                </div>
            </div>
        `;
        
        // Show the dialog
        console.log('Making dialog visible');
        shareDialog.classList.add('visible');
        shareDialog.style.display = 'flex'; // Ensure it's visible with inline style too
        
        // Set up close button handlers
        const closeButton = shareDialog.querySelector('.close-button');
        if (closeButton) {
            console.log('Setting up close button handler');
            closeButton.addEventListener('click', () => {
                console.log('Close button clicked');
                shareDialog.classList.remove('visible');
                setTimeout(() => {
                    shareDialog.remove();
                }, 300); // Wait for animation
            });
        } else {
            console.warn('Close button not found in the dialog');
        }
        
        console.log('Attempting to generate sharing code');
        // Generate the sharing code and update the dialog
        generateSharingCode(workoutId, isRoutine, routineWorkouts)
            .then(shareCode => {
                console.log('Share code generated successfully:', shareCode);
                const shareUrl = getSharingUrl(shareCode);
                console.log('Share URL created:', shareUrl);
                
                // Hide loading, show link
                const loadingIndicator = shareDialog.querySelector('.loading-indicator');
                const linkContainer = shareDialog.querySelector('.share-link-container');
                
                if (loadingIndicator && linkContainer) {
                    loadingIndicator.style.display = 'none';
                    linkContainer.style.display = 'block';
                    
                    // Set the URL in the input field
                    const shareUrlInput = document.getElementById('shareUrlInput');
                    if (shareUrlInput) {
                        shareUrlInput.value = shareUrl;
                        
                        // Set up copy button
                        const copyButton = document.getElementById('copyShareUrl');
                        if (copyButton) {
                            copyButton.addEventListener('click', () => {
                                copyToClipboard(shareUrl).then(success => {
                                    console.log('Copy to clipboard result:', success);
                                    if (success) {
                                        const copyConfirmation = document.getElementById('copyConfirmation');
                                        if (copyConfirmation) {
                                            copyConfirmation.style.display = 'flex';
                                            setTimeout(() => {
                                                copyConfirmation.style.display = 'none';
                                            }, 3000);
                                        }
                                    }
                                });
                            });
                        } else {
                            console.warn('Copy button not found');
                        }
                    } else {
                        console.warn('Share URL input not found');
                    }
                } else {
                    console.warn('Loading indicator or link container not found');
                }
            })
            .catch(error => {
                console.error('Error generating share link:', error);
                
                // Show error in dialog
                const loadingIndicator = shareDialog.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.innerHTML = `
                        <span class="material-icons" style="color: #ff5252; font-size: 48px; margin-bottom: 15px;">error</span>
                        <p style="color: #ff5252;">Error generating sharing link: ${error.message || 'Unknown error'}. Please try again.</p>
                    `;
                }
            });
    } catch (error) {
        console.error('Critical error in showShareWorkoutDialog:', error);
        alert('Sorry, there was a problem showing the share dialog. Please try again later.');
    }
}

/**
 * Extract YouTube video ID from a URL
 * @param {string} url - The YouTube URL
 * @returns {string|null} - The video ID or null if not a valid YouTube URL
 */
function extractYoutubeVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Normalize workout data from different collections into a standard format
 * @param {Object} workoutData - Raw workout data from any collection
 * @param {string} workoutId - Original workoutId to ensure it's preserved
 * @returns {Object} - Normalized workout data ready for import
 */
function normalizeWorkoutData(workoutData, workoutId) {
    console.log('Normalizing workout data:', workoutData);
    
    // Handle video data regardless of source format
    let videoUrl = null;
    let videoTitle = null;
    let thumbnailUrl = null;
    
    // Check all possible locations for video data
    if (workoutData.video && typeof workoutData.video === 'object') {
        videoUrl = workoutData.video.url || null;
        videoTitle = workoutData.video.title || null;
        thumbnailUrl = workoutData.video.thumbnail || null;
    }
    
    // Also check for direct fields
    videoUrl = workoutData.videoUrl || videoUrl;
    videoTitle = workoutData.videoTitle || videoTitle;
    thumbnailUrl = workoutData.thumbnailUrl || thumbnailUrl;
    
    // Process YouTube URL to generate thumbnail if not already provided
    if (videoUrl && !thumbnailUrl) {
        const videoId = extractYoutubeVideoId(videoUrl);
        if (videoId) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            console.log('Generated YouTube thumbnail:', thumbnailUrl);
        }
    }
    
    console.log('Extracted video data:', { videoUrl, videoTitle, thumbnailUrl });
    
    // Create a base workout object with required fields - make exact copy of original
    const normalizedWorkout = {
        // First include all original properties from source workout
        ...workoutData,
        
        // Then override key properties as needed
        title: workoutData.title || 'Unknown Workout',
        description: workoutData.description || '', // Keep original description exactly as is
        duration: workoutData.duration || '',       // Keep original duration exactly as is
        difficulty: workoutData.difficulty || '',   // Keep original difficulty exactly as is
        workoutId: workoutId, // Ensure we preserve the original ID
        
        // Store video data in multiple formats to ensure compatibility
        video: {
            url: videoUrl,
            title: videoTitle,
            thumbnail: thumbnailUrl,
            type: 'youtube' // Specify the video type
        },
        videoUrl: videoUrl, 
        videoTitle: videoTitle,
        thumbnailUrl: thumbnailUrl,
        
        // Original metadata
        originalWorkoutId: workoutData.originalWorkoutId || workoutId,
        originalFirebaseId: workoutData.originalFirebaseId || null,
        
        // Add import timestamp
        importedAt: new Date().toISOString()
    };
    
    // Clean up the data
    if (normalizedWorkout.exercises && !Array.isArray(normalizedWorkout.exercises)) {
        normalizedWorkout.exercises = [];
    }
    
    console.log('Normalized workout data:', normalizedWorkout);
    return normalizedWorkout;
} 