import { getCurrentUser, logoutUser, initAuthStateObserver } from './firebase-config.js';

// Initialize auth UI elements on all pages
export function initAuthUI() {
  // Find the header actions div on the page
  const headerActionsContainer = document.querySelector('.header-actions');
  
  if (!headerActionsContainer) {
    console.error('Header actions container not found on this page');
    return;
  }
  
  // Create account icon container
  const accountContainer = document.createElement('div');
  accountContainer.className = 'auth-container';
  accountContainer.innerHTML = `
    <div class="account-icon-container">
      <span class="material-icons account-icon">account_circle</span>
      <div class="account-dropdown">
        <div class="account-info">
          <span class="user-email" id="userEmail">Not logged in</span>
        </div>
        <div class="user-profile" id="profileSection" style="display: none;">
          <a href="../pages/profile.html" class="profile-link">
            <span class="material-icons">person</span>
            Profile
          </a>
        </div>
        <a href="../pages/login.html" class="dropdown-item" id="loginLink">
          <span class="material-icons">login</span>
          Login
        </a>
        <a href="../pages/register.html" class="dropdown-item" id="registerLink">
          <span class="material-icons">person_add</span>
          Register
        </a>
        <a href="#" class="dropdown-item" id="logoutLink" style="display: none;">
          <span class="material-icons">logout</span>
          Logout
        </a>
      </div>
    </div>
  `;
  
  // Add account icon to the header
  headerActionsContainer.appendChild(accountContainer);
  
  // Add event listener for account dropdown
  const accountIcon = accountContainer.querySelector('.account-icon');
  const accountDropdown = accountContainer.querySelector('.account-dropdown');
  
  accountIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    accountDropdown.classList.toggle('show');
  });
  
  // Prevent click inside dropdown from closing it
  accountDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    accountDropdown.classList.remove('show');
  });
  
  // Set up logout functionality
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await logoutUser();
        window.location.href = '../pages/index.html';
      } catch (error) {
        console.error('Error logging out:', error);
      }
    });
  }
  
  // Initialize auth state observer
  initAuthStateObserver(updateUIForUser);
}

// Update UI based on auth state
function updateUIForUser(user) {
  const userEmail = document.getElementById('userEmail');
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const logoutLink = document.getElementById('logoutLink');
  const profileSection = document.getElementById('profileSection');
  
  if (user) {
    // User is signed in
    if (userEmail) userEmail.textContent = user.email;
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'flex';
    if (profileSection) profileSection.style.display = 'block';
    
    // Add user-specific functionality here
    console.log('User is logged in:', user.uid);
  } else {
    // User is signed out
    if (userEmail) userEmail.textContent = 'Not logged in';
    if (loginLink) loginLink.style.display = 'flex';
    if (registerLink) registerLink.style.display = 'flex';
    if (logoutLink) logoutLink.style.display = 'none';
    if (profileSection) profileSection.style.display = 'none';
  }
} 