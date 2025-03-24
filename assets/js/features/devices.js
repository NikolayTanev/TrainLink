// Whoop API Configuration
const WHOOP_CLIENT_ID = 'e335ecdc-abb6-4b2c-99a7-19b00729a221';
const WHOOP_CLIENT_SECRET = '1096aea0edd346cf1888a1cd7dd8a6b1ca5a4d31289fc6a040f8c1e2139bfc1d';
const WHOOP_REDIRECT_URI = `${window.location.origin}/devices`;
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_URL = 'https://api.prod.whoop.com/rest';

// Define required scopes
const WHOOP_SCOPES = [
    'read:recovery',
    'read:cycles',
    'read:sleep',
    'read:workout',
    'read:body_measurement'
].join(' ');

// DOM Elements
let connectWhoopBtn = document.getElementById('connect-whoop');
let disconnectWhoopBtn = document.getElementById('disconnect-whoop');
let whoopStatus = document.getElementById('whoop-status');
const connectionDetailsSection = document.getElementById('connection-details-section');
const connectionInfo = document.getElementById('connection-info');
const dataPreviewSection = document.getElementById('data-preview-section');
const dataContainer = document.getElementById('data-container');
const syncNowBtn = document.getElementById('sync-now');
const lastSyncedEl = document.getElementById('last-synced');
const autoSyncCheckbox = document.getElementById('auto-sync');
const categoryTabs = document.querySelectorAll('.category-tab');

// Storage Keys
const STORAGE_KEY_WHOOP_TOKEN = 'whoop_access_token';
const STORAGE_KEY_WHOOP_REFRESH = 'whoop_refresh_token';
const STORAGE_KEY_WHOOP_EXPIRES = 'whoop_token_expires';
const STORAGE_KEY_LAST_SYNC = 'whoop_last_sync';
const STORAGE_KEY_AUTO_SYNC = 'whoop_auto_sync';

// Current data state
let currentCategory = 'recovery';
let whoopData = {
    recovery: null,
    sleep: null,
    workouts: null,
    strain: null
};

// Check if we have existing credentials
function checkWhoopConnection() {
    console.log('Checking Whoop connection status');
    const accessToken = localStorage.getItem(STORAGE_KEY_WHOOP_TOKEN);
    const tokenExpires = localStorage.getItem(STORAGE_KEY_WHOOP_EXPIRES);
    
    console.log('Access token exists:', !!accessToken);
    console.log('Token expiration exists:', !!tokenExpires);
    
    if (accessToken && tokenExpires) {
        // Check if token is expired
        const expiryDate = new Date(parseInt(tokenExpires));
        const now = new Date();
        
        console.log('Token expires:', expiryDate);
        console.log('Current time:', now);
        console.log('Token is valid:', now < expiryDate);
        
        if (now < expiryDate) {
            // Token is still valid
            console.log('Using existing valid token');
            updateUIConnected();
            loadConnectionDetails();
            
            // Load the data if we have any
            loadWhoopData();
            return true;
        } else {
            // Try to refresh the token
            console.log('Token expired, attempting refresh');
            const refreshToken = localStorage.getItem(STORAGE_KEY_WHOOP_REFRESH);
            if (refreshToken) {
                console.log('Refresh token exists, attempting to refresh');
                refreshWhoopToken(refreshToken);
                return true;
            } else {
                console.log('No refresh token found');
            }
        }
    }
    
    // No valid connection
    console.log('No valid Whoop connection found');
    updateUIDisconnected();
    return false;
}

// Connect to Whoop (OAuth flow)
function connectToWhoop() {
    // Build the authorization URL
    const authUrl = new URL(WHOOP_AUTH_URL);
    authUrl.searchParams.append('client_id', WHOOP_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', WHOOP_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', WHOOP_SCOPES);
    authUrl.searchParams.append('state', generateRandomState());
    
    // Redirect to the Whoop authorization page
    window.location.href = authUrl.toString();
}

// Disconnect from Whoop
function disconnectFromWhoop() {
    // Clear stored tokens and data
    localStorage.removeItem(STORAGE_KEY_WHOOP_TOKEN);
    localStorage.removeItem(STORAGE_KEY_WHOOP_REFRESH);
    localStorage.removeItem(STORAGE_KEY_WHOOP_EXPIRES);
    localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
    
    // Clear any cached data
    whoopData = {
        recovery: null,
        sleep: null,
        workouts: null,
        strain: null
    };
    
    // Update UI
    updateUIDisconnected();
    connectionDetailsSection.classList.add('hidden');
    dataPreviewSection.classList.add('hidden');
}

// Handle the OAuth redirect
function handleOAuthRedirect() {
    console.log('Handling OAuth redirect');
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('Code:', code ? 'Present' : 'Missing');
    
    if (code) {
        console.log('Authorization code received, exchanging for token');
        // Exchange the authorization code for an access token
        exchangeCodeForToken(code);
        
        // Clean up the URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    } else {
        console.log('No authorization code found in URL');
    }
}

// Modify the exchangeCodeForToken function to remove webhook registration
async function exchangeCodeForToken(code) {
    try {
        console.log('Initiating token exchange');
        const tokenRequest = {
            client_id: WHOOP_CLIENT_ID,
            client_secret: WHOOP_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: WHOOP_REDIRECT_URI
        };
        
        console.log('Token request params:', JSON.stringify(tokenRequest));
        
        const response = await fetch(WHOOP_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenRequest)
        });
        
        console.log('Token response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token response error:', errorText);
            throw new Error(`Failed to get token: ${response.status} - ${errorText}`);
        }
        
        const tokenData = await response.json();
        console.log('Token data received:', Object.keys(tokenData).join(', '));
        
        if (!tokenData.access_token) {
            console.error('No access token in response:', tokenData);
            throw new Error('Invalid token response: Missing access token');
        }
        
        // Store the tokens
        localStorage.setItem(STORAGE_KEY_WHOOP_TOKEN, tokenData.access_token);
        localStorage.setItem(STORAGE_KEY_WHOOP_REFRESH, tokenData.refresh_token);
        
        // Calculate token expiry time (subtract 5 minutes for safety)
        const expiresIn = tokenData.expires_in - 300; 
        const expiryTime = new Date().getTime() + (expiresIn * 1000);
        localStorage.setItem(STORAGE_KEY_WHOOP_EXPIRES, expiryTime.toString());
        
        console.log('Tokens stored in localStorage:');
        console.log('- Access token:', maskToken(tokenData.access_token));
        console.log('- Refresh token:', tokenData.refresh_token ? 'Present' : 'Missing');
        console.log('- Expires at:', new Date(expiryTime).toISOString());
        
        // Update UI immediately
        updateUIConnected();
        loadConnectionDetails();
        
        // Fetch initial data
        await syncWhoopData();
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        showError('Failed to connect to Whoop. Please try again.');
    }
}

// Refresh the Whoop access token
async function refreshWhoopToken(refreshToken) {
    try {
        const tokenRequest = {
            client_id: WHOOP_CLIENT_ID,
            client_secret: WHOOP_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        };
        
        const response = await fetch(WHOOP_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenRequest)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to refresh token: ${response.status}`);
        }
        
        const tokenData = await response.json();
        
        // Store the new tokens
        localStorage.setItem(STORAGE_KEY_WHOOP_TOKEN, tokenData.access_token);
        localStorage.setItem(STORAGE_KEY_WHOOP_REFRESH, tokenData.refresh_token);
        
        // Calculate token expiry time (subtract 5 minutes for safety)
        const expiresIn = tokenData.expires_in - 300;
        const expiryTime = new Date().getTime() + (expiresIn * 1000);
        localStorage.setItem(STORAGE_KEY_WHOOP_EXPIRES, expiryTime.toString());
        
        // Update UI
        updateUIConnected();
        
        return true;
    } catch (error) {
        console.error('Error refreshing token:', error);
        
        // Token refresh failed, need to reconnect
        updateUIDisconnected();
        return false;
    }
}

// Make authenticated API requests to Whoop
async function whoopApiRequest(endpoint, method = 'GET', data = null) {
    console.log(`Making API request: ${endpoint}`);
    
    // Check if token needs refresh
    const tokenExpires = localStorage.getItem(STORAGE_KEY_WHOOP_EXPIRES);
    const now = new Date();
    const expiryDate = new Date(parseInt(tokenExpires));
    
    if (now >= expiryDate) {
        console.log('Token expired, refreshing...');
        const refreshToken = localStorage.getItem(STORAGE_KEY_WHOOP_REFRESH);
        const refreshed = await refreshWhoopToken(refreshToken);
        
        if (!refreshed) {
            throw new Error('Authentication failed. Please reconnect your Whoop account.');
        }
        console.log('Token refreshed successfully');
    }
    
    // Get the access token
    const accessToken = localStorage.getItem(STORAGE_KEY_WHOOP_TOKEN);
    
    if (!accessToken) {
        console.error('No access token found');
        throw new Error('No access token available. Please reconnect your Whoop account.');
    }
    
    // Make the request
    const url = `${WHOOP_API_URL}${endpoint}`;
    console.log(`Calling Whoop API: ${url}`);
    
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    console.log(`API response status: ${response.status}`);
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API error (${response.status}):`, errorBody);
        throw new Error(`API request failed: ${response.status} - ${errorBody}`);
    }
    
    const responseData = await response.json();
    console.log(`API response received for ${endpoint}`);
    return responseData;
}

// Update the syncWhoopData function to use the REST API endpoints
async function syncWhoopData() {
    console.log('Starting data sync');
    
    if (!checkWhoopConnection()) {
        console.error('No valid Whoop connection found');
        return;
    }
    
    try {
        // Show loading state
        dataContainer.innerHTML = '<div class="loading-spinner">Loading data...</div>';
        console.log('Fetching Whoop data...');
        
        // Get user information first to get userId
        const userInfo = await whoopApiRequest('/user/profile/basic');
        console.log('User info received:', userInfo.user.id ? 'Success' : 'Failed');
        
        // Use the user ID for subsequent requests
        const userId = userInfo.user.id;
        
        if (!userId) {
            throw new Error('Could not retrieve user ID from Whoop API');
        }
        
        // Get current timestamp for queries
        const now = new Date();
        const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 30 days ago
        const endDate = now.toISOString().split('T')[0]; // today
        
        try {
            const recoveryPromise = whoopApiRequest(`/users/${userId}/cycles?start=${startDate}&end=${endDate}`);
            const sleepPromise = whoopApiRequest(`/users/${userId}/sleeps?start=${startDate}&end=${endDate}`);
            const workoutPromise = whoopApiRequest(`/users/${userId}/workouts?start=${startDate}&end=${endDate}`);
            
            console.log('API requests initiated');
            
            const [recoveryData, sleepData, workoutData] = await Promise.all([
                recoveryPromise.catch(err => {
                    console.error('Recovery data fetch failed:', err);
                    return null;
                }),
                sleepPromise.catch(err => {
                    console.error('Sleep data fetch failed:', err);
                    return null;
                }),
                workoutPromise.catch(err => {
                    console.error('Workout data fetch failed:', err);
                    return null;
                })
            ]);
            
            console.log('Data received:', {
                recovery: recoveryData ? 'Success' : 'Failed',
                sleep: sleepData ? 'Success' : 'Failed',
                workouts: workoutData ? 'Success' : 'Failed'
            });
            
            // Store the data
            whoopData.recovery = recoveryData;
            whoopData.sleep = sleepData;
            whoopData.workouts = workoutData;
            whoopData.strain = recoveryData; // Strain data is part of the cycles response
            
            // Update last synced timestamp
            localStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toISOString());
            lastSyncedEl.textContent = `Last synced: ${formatDateTime(now)}`;
            
            // Update UI
            dataPreviewSection.classList.remove('hidden');
            displayCurrentCategoryData();
            
            console.log('Data sync completed successfully');
            
        } catch (apiError) {
            console.error('Error in API request bundle:', apiError);
            throw apiError;
        }
    } catch (error) {
        console.error('Error syncing Whoop data:', error);
        dataContainer.innerHTML = `<div class="error-message">Failed to sync data: ${error.message}</div>`;
    }
}

// Display data for the current category
function displayCurrentCategoryData() {
    const data = whoopData[currentCategory];
    
    if (!data) {
        dataContainer.innerHTML = '<div class="empty-state"><p>No data available</p></div>';
        return;
    }
    
    let html = '';
    
    switch (currentCategory) {
        case 'recovery':
            html = renderRecoveryData(data);
            break;
        case 'sleep':
            html = renderSleepData(whoopData.sleep);
            break;
        case 'workouts':
            html = renderWorkoutData(whoopData.workouts);
            break;
        case 'strain':
            html = renderStrainData(whoopData.strain);
            break;
    }
    
    dataContainer.innerHTML = html;
}

// Update render functions to handle the new data format
function renderRecoveryData(data) {
    if (!data || !data.records || data.records.length === 0) {
        return '<div class="empty-state"><p>No recovery data available</p></div>';
    }
    
    const records = data.records.slice(0, 10); // Get most recent records
    
    let html = '<div class="data-list">';
    
    records.forEach(record => {
        const recovery = record.recovery || {};
        const dateObj = new Date(record.created_at || record.timestamp);
        const date = formatDate(dateObj);
        const score = recovery.score || 'N/A';
        const rhr = recovery.resting_heart_rate || 'N/A';
        const hrv = recovery.hrv_rmssd || 'N/A';
        
        html += `
            <div class="data-item">
                <div class="data-date">${date}</div>
                <div class="data-metrics">
                    <div class="metric">
                        <span class="metric-label">Recovery Score</span>
                        <span class="metric-value">${score}%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Resting HR</span>
                        <span class="metric-value">${rhr} bpm</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">HRV</span>
                        <span class="metric-value">${hrv} ms</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderSleepData(data) {
    if (!data || !data.records || data.records.length === 0) {
        return '<div class="empty-state"><p>No sleep data available</p></div>';
    }
    
    const records = data.records.slice(0, 10); // Get most recent records
    
    let html = '<div class="data-list">';
    
    records.forEach(record => {
        const dateObj = new Date(record.created_at || record.timestamp);
        const date = formatDate(dateObj);
        
        // Calculate duration in hours and minutes
        const durationMinutes = record.total_in_bed_time_milli ? Math.floor(record.total_in_bed_time_milli / 60000) : 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const duration = `${hours}h ${minutes}m`;
        
        // Format start and end times
        const start = record.start_time ? formatTime(new Date(record.start_time)) : 'N/A';
        const end = record.end_time ? formatTime(new Date(record.end_time)) : 'N/A';
        
        html += `
            <div class="data-item">
                <div class="data-date">${date}</div>
                <div class="data-metrics">
                    <div class="metric">
                        <span class="metric-label">Duration</span>
                        <span class="metric-value">${duration}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Start Time</span>
                        <span class="metric-value">${start}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">End Time</span>
                        <span class="metric-value">${end}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderWorkoutData(data) {
    if (!data || !data.records || data.records.length === 0) {
        return '<div class="empty-state"><p>No workout data available</p></div>';
    }
    
    const records = data.records.slice(0, 10); // Get most recent records
    
    let html = '<div class="data-list">';
    
    records.forEach(record => {
        const dateObj = new Date(record.created_at || record.timestamp);
        const date = formatDate(dateObj);
        
        // Calculate duration in hours and minutes
        const durationMinutes = record.duration_milli ? Math.floor(record.duration_milli / 60000) : 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const duration = `${hours}h ${minutes}m`;
        
        // Get workout details
        const activityType = record.sport_name || 'Unknown';
        const strain = record.strain ? record.strain.toFixed(1) : 'N/A';
        
        html += `
            <div class="data-item">
                <div class="data-date">${date}</div>
                <div class="data-metrics">
                    <div class="metric">
                        <span class="metric-label">Activity</span>
                        <span class="metric-value">${activityType}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Duration</span>
                        <span class="metric-value">${duration}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Strain</span>
                        <span class="metric-value">${strain}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderStrainData(data) {
    if (!data || !data.records || data.records.length === 0) {
        return '<div class="empty-state"><p>No strain data available</p></div>';
    }
    
    const records = data.records.slice(0, 10); // Get most recent records
    
    let html = '<div class="data-list">';
    
    records.forEach(record => {
        const dateObj = new Date(record.created_at || record.timestamp);
        const date = formatDate(dateObj);
        
        // Get strain details
        const dayStrain = record.strain ? record.strain.toFixed(1) : 'N/A';
        const avgHeartRate = record.average_heart_rate ? Math.round(record.average_heart_rate) : 'N/A';
        const maxHeartRate = record.max_heart_rate ? Math.round(record.max_heart_rate) : 'N/A';
        
        html += `
            <div class="data-item">
                <div class="data-date">${date}</div>
                <div class="data-metrics">
                    <div class="metric">
                        <span class="metric-label">Day Strain</span>
                        <span class="metric-value">${dayStrain}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Avg HR</span>
                        <span class="metric-value">${avgHeartRate} bpm</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Max HR</span>
                        <span class="metric-value">${maxHeartRate} bpm</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Load Whoop connection details
function loadConnectionDetails() {
    const accessToken = localStorage.getItem(STORAGE_KEY_WHOOP_TOKEN);
    const tokenExpires = localStorage.getItem(STORAGE_KEY_WHOOP_EXPIRES);
    
    if (accessToken && tokenExpires) {
        // Format the expiry date
        const expiryDate = new Date(parseInt(tokenExpires));
        const formattedExpiry = formatDateTime(expiryDate);
        
        // Get last sync time
        const lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
        const lastSyncText = lastSync ? `Last synced: ${formatDateTime(new Date(lastSync))}` : 'Last synced: Never';
        lastSyncedEl.textContent = lastSyncText;
        
        // Update connection info
        connectionInfo.innerHTML = `
            <p><span class="label">Status:</span> <span class="value">Connected</span></p>
            <p><span class="label">Token:</span> <span class="value">${maskToken(accessToken)}</span></p>
            <p><span class="label">Expires:</span> <span class="value">${formattedExpiry}</span></p>
        `;
        
        connectionDetailsSection.classList.remove('hidden');
        
        // Check auto-sync setting
        const autoSync = localStorage.getItem(STORAGE_KEY_AUTO_SYNC);
        autoSyncCheckbox.checked = autoSync !== 'false';
    }
}

// Load any stored Whoop data
function loadWhoopData() {
    // Check if we have recent sync data
    const lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
    
    if (lastSync) {
        const lastSyncDate = new Date(lastSync);
        const now = new Date();
        const hoursSinceSync = (now - lastSyncDate) / (1000 * 60 * 60);
        
        lastSyncedEl.textContent = `Last synced: ${formatDateTime(lastSyncDate)}`;
        
        // If it's been more than 24 hours, sync again
        if (hoursSinceSync > 24) {
            syncWhoopData();
        } else {
            // Otherwise show the data preview section
            dataPreviewSection.classList.remove('hidden');
            displayCurrentCategoryData();
        }
    } else {
        // No previous sync, fetch new data
        syncWhoopData();
    }
}

// Update UI when connected
function updateUIConnected() {
    console.log('Updating UI to connected state');
    
    // Ensure DOM elements exist
    if (!connectWhoopBtn || !disconnectWhoopBtn || !whoopStatus) {
        console.error('Missing DOM elements for UI update:',
            {connectBtn: !!connectWhoopBtn, disconnectBtn: !!disconnectWhoopBtn, status: !!whoopStatus});
        
        // Try to get references again
        const connectBtn = document.getElementById('connect-whoop');
        const disconnectBtn = document.getElementById('disconnect-whoop');
        const status = document.getElementById('whoop-status');
        
        if (connectBtn) connectWhoopBtn = connectBtn;
        if (disconnectBtn) disconnectWhoopBtn = disconnectBtn;
        if (status) whoopStatus = status;
    }
    
    if (connectWhoopBtn) connectWhoopBtn.classList.add('hidden');
    if (disconnectWhoopBtn) disconnectWhoopBtn.classList.remove('hidden');
    if (whoopStatus) {
        whoopStatus.textContent = 'Connected';
        whoopStatus.classList.add('connected');
    }
    
    console.log('UI updated to connected state');
}

// Update UI when disconnected
function updateUIDisconnected() {
    console.log('Updating UI to disconnected state');
    
    // Ensure DOM elements exist
    if (!connectWhoopBtn || !disconnectWhoopBtn || !whoopStatus) {
        console.error('Missing DOM elements for UI update');
        
        // Try to get references again
        const connectBtn = document.getElementById('connect-whoop');
        const disconnectBtn = document.getElementById('disconnect-whoop');
        const status = document.getElementById('whoop-status');
        
        if (connectBtn) connectWhoopBtn = connectBtn;
        if (disconnectBtn) disconnectWhoopBtn = disconnectBtn;
        if (status) whoopStatus = status;
    }
    
    if (connectWhoopBtn) connectWhoopBtn.classList.remove('hidden');
    if (disconnectWhoopBtn) disconnectWhoopBtn.classList.add('hidden');
    if (whoopStatus) {
        whoopStatus.textContent = 'Not Connected';
        whoopStatus.classList.remove('connected');
    }
    
    console.log('UI updated to disconnected state');
}

// Utility function to generate a random state for OAuth
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Utility function to format dates
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Utility function to format times
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Utility function to format date and time
function formatDateTime(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utility function to mask token for display
function maskToken(token) {
    if (!token) return '';
    const firstChars = token.substring(0, 6);
    const lastChars = token.substring(token.length - 4);
    return `${firstChars}...${lastChars}`;
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize DOM references once the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Re-acquire DOM elements to ensure we have them
    connectWhoopBtn = document.getElementById('connect-whoop');
    disconnectWhoopBtn = document.getElementById('disconnect-whoop');
    whoopStatus = document.getElementById('whoop-status');
    
    console.log('DOM elements initialized:', 
        {connectBtn: !!connectWhoopBtn, disconnectBtn: !!disconnectWhoopBtn, status: !!whoopStatus});
    
    console.log('Page loaded, initializing Whoop connection');
    
    // Rest of initialization...
    // Check for OAuth redirect
    if (window.location.search.includes('code=')) {
        console.log('OAuth redirect detected');
        handleOAuthRedirect();
    } else {
        console.log('No OAuth parameters found, checking for existing connection');
        // Check for existing connection
        checkWhoopConnection();
    }
    
    // Setup event listeners
    if (connectWhoopBtn) {
        connectWhoopBtn.addEventListener('click', connectToWhoop);
    }
    
    if (disconnectWhoopBtn) {
        disconnectWhoopBtn.addEventListener('click', disconnectFromWhoop);
    }
    
    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', syncWhoopData);
    }
    
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_AUTO_SYNC, autoSyncCheckbox.checked);
        });
    }
    
    // Category tab handling
    if (categoryTabs) {
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update current category
                currentCategory = tab.dataset.category;
                
                // Display data for the selected category
                displayCurrentCategoryData();
            });
        });
    }
});

// Add necessary styles for data display
document.head.insertAdjacentHTML('beforeend', `
<style>
.data-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.data-item {
    background-color: #252525;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.data-date {
    font-weight: 600;
    color: #fff;
    margin-bottom: 10px;
    font-size: 1.1rem;
}

.data-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.metric {
    display: flex;
    flex-direction: column;
    min-width: 100px;
}

.metric-label {
    font-size: 0.8rem;
    color: #aaa;
    margin-bottom: 5px;
}

.metric-value {
    font-size: 1.1rem;
    color: #fff;
    font-weight: 500;
}

.loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #aaa;
}

.error-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #d32f2f;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

@media (max-width: 768px) {
    .data-metrics {
        flex-direction: column;
        gap: 10px;
    }
    
    .metric {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    
    .metric-label {
        margin-bottom: 0;
    }
}
</style>
`); 