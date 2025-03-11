// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let authToken = localStorage.getItem('authToken');

// Helper function for making API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Add auth token if available
    if (authToken) {
        headers['Authorization'] = `Token ${authToken}`;
    }
    
    const options = {
        method,
        headers,
        credentials: 'include',
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        console.log(`Making API request to: ${url}`, { method, data });
        const response = await fetch(url, options);
        
        // Handle unauthorized responses
        if (response.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('authToken');
            authToken = null;
            window.location.href = 'login.html';
            return null;
        }
        
        // Check if response is empty
        const responseText = await response.text();
        if (!responseText) {
            throw new Error(`Empty response from server (Status: ${response.status})`);
        }
        
        // Try to parse JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', responseText);
            throw new Error(`Invalid JSON response (Status: ${response.status}): ${responseText.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
            const error = new Error(responseData.detail || `API request failed with status ${response.status}`);
            error.response = { status: response.status, data: responseData };
            throw error;
        }
        
        return responseData;
    } catch (error) {
        console.error('API request error:', error);
        // Check if it's a network error (server not running)
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to the server. Please make sure the backend server is running at http://127.0.0.1:8000');
        }
        throw error;
    }
}

// Authentication functions
async function register(userData) {
    const response = await apiRequest('/users/register/', 'POST', userData);
    if (response && response.token) {
        // Save token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        authToken = response.token;
    }
    return response;
}

async function login(credentials) {
    const response = await apiRequest('/users/login/', 'POST', credentials);
    if (response && response.token) {
        // Save token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        authToken = response.token;
    }
    return response;
}

function logout() {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    authToken = null;
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// User profile functions
async function getUserProfile() {
    return await apiRequest('/users/profile/');
}

async function updateUserProfile(profileData) {
    return await apiRequest('/users/profile/', 'PATCH', profileData);
}

async function changePassword(passwordData) {
    return await apiRequest('/users/change-password/', 'POST', passwordData);
}

// Workout functions
async function getWorkouts() {
    return await apiRequest('/workouts/workouts/');
}

async function getWorkout(id) {
    return await apiRequest(`/workouts/workouts/${id}/`);
}

async function createWorkout(workoutData) {
    return await apiRequest('/workouts/workouts/', 'POST', workoutData);
}

async function updateWorkout(id, workoutData) {
    return await apiRequest(`/workouts/workouts/${id}/`, 'PUT', workoutData);
}

async function deleteWorkout(id) {
    return await apiRequest(`/workouts/workouts/${id}/`, 'DELETE');
}

async function toggleFavorite(id) {
    return await apiRequest(`/workouts/workouts/${id}/toggle_favorite/`, 'POST');
}

// Scheduled workout functions
async function getScheduledWorkouts() {
    return await apiRequest('/workouts/scheduled/');
}

async function getUpcomingWorkouts() {
    return await apiRequest('/workouts/scheduled/upcoming/');
}

async function scheduleWorkout(scheduledWorkoutData) {
    return await apiRequest('/workouts/scheduled/', 'POST', scheduledWorkoutData);
}

async function deleteScheduledWorkout(id) {
    return await apiRequest(`/workouts/scheduled/${id}/`, 'DELETE');
}

// Workout log functions
async function getWorkoutLogs() {
    return await apiRequest('/workouts/logs/');
}

async function logWorkout(logData) {
    return await apiRequest('/workouts/logs/', 'POST', logData);
}

async function getWorkoutStats() {
    return await apiRequest('/workouts/logs/stats/');
}

// Export all functions
window.api = {
    // Auth
    register,
    login,
    logout,
    
    // User profile
    getUserProfile,
    updateUserProfile,
    changePassword,
    
    // Workouts
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    toggleFavorite,
    
    // Scheduled workouts
    getScheduledWorkouts,
    getUpcomingWorkouts,
    scheduleWorkout,
    deleteScheduledWorkout,
    
    // Workout logs
    getWorkoutLogs,
    logWorkout,
    getWorkoutStats
}; 