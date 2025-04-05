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
    
    // Basic URL with no routing complexity - simple and reliable
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/pages/shared-workout.html?code=${shareCode}`;
    
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
        // TODO: Implement this function to import shared workouts
        console.log('Importing shared workout:', shareCode);
        
        // This would involve:
        // 1. Getting the shared workout data
        // 2. Retrieving workout details from Firestore
        // 3. Adding them to the current user's workouts
        
        throw new Error('Import shared workout not yet implemented');
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