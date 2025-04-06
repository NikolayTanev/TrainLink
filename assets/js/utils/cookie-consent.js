/**
 * Cookie Consent Management for TrainLink
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptCookiesBtn = document.getElementById('acceptCookies');
    const customizeCookiesBtn = document.getElementById('customizeCookies');
    const cookieSettingsOverlay = document.getElementById('cookieSettingsOverlay');
    const openCookieSettingsBtn = document.getElementById('openCookieSettings');
    const cancelCookieSettingsBtn = document.getElementById('cancelCookieSettings');
    const saveCookieSettingsBtn = document.getElementById('saveCookieSettings');
    const analyticsConsentCheckbox = document.getElementById('analyticsConsent');
    const advertisingConsentCheckbox = document.getElementById('advertisingConsent');
    
    // Check if consent has already been given
    const consentGiven = localStorage.getItem('cookieConsent');
    
    // If no consent has been given, show the banner
    if (!consentGiven) {
        cookieBanner.style.display = 'block';
    } else {
        // Apply saved preferences
        applyConsentPreferences();
    }
    
    // Accept all cookies
    acceptCookiesBtn.addEventListener('click', function() {
        setConsent({
            essential: true,
            analytics: true,
            advertising: true
        });
        cookieBanner.style.display = 'none';
    });
    
    // Open customize dialog
    customizeCookiesBtn.addEventListener('click', function() {
        cookieBanner.style.display = 'none';
        cookieSettingsOverlay.style.display = 'flex';
        
        // Load saved preferences if they exist
        const savedPreferences = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
        if (savedPreferences.analytics !== undefined) {
            analyticsConsentCheckbox.checked = savedPreferences.analytics;
        }
        if (savedPreferences.advertising !== undefined) {
            advertisingConsentCheckbox.checked = savedPreferences.advertising;
        }
    });
    
    // Open cookie settings from footer link
    openCookieSettingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        cookieSettingsOverlay.style.display = 'flex';
        
        // Load saved preferences if they exist
        const savedPreferences = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
        if (savedPreferences.analytics !== undefined) {
            analyticsConsentCheckbox.checked = savedPreferences.analytics;
        }
        if (savedPreferences.advertising !== undefined) {
            advertisingConsentCheckbox.checked = savedPreferences.advertising;
        }
    });
    
    // Cancel cookie settings
    cancelCookieSettingsBtn.addEventListener('click', function() {
        cookieSettingsOverlay.style.display = 'none';
        
        // If no consent has been given yet, show the banner again
        if (!localStorage.getItem('cookieConsent')) {
            cookieBanner.style.display = 'block';
        }
    });
    
    // Save cookie preferences
    saveCookieSettingsBtn.addEventListener('click', function() {
        const preferences = {
            essential: true, // Essential cookies are always required
            analytics: analyticsConsentCheckbox.checked,
            advertising: advertisingConsentCheckbox.checked
        };
        
        setConsent(preferences);
        cookieSettingsOverlay.style.display = 'none';
    });
    
    // Function to save consent preferences
    function setConsent(preferences) {
        localStorage.setItem('cookieConsent', JSON.stringify(preferences));
        applyConsentPreferences();
    }
    
    // Apply consent preferences to the page
    function applyConsentPreferences() {
        const preferences = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
        
        // Handle Google Analytics consent
        if (preferences.analytics === false) {
            // Disable Google Analytics
            window['ga-disable-G-5BCPY2QYD5'] = true;
        } else {
            // Enable Google Analytics
            window['ga-disable-G-5BCPY2QYD5'] = false;
        }
        
        // Handle AdSense consent
        if (preferences.advertising === false) {
            // Add code to disable AdSense if possible
            // Note: AdSense doesn't have a simple disable flag like Analytics
            // This would typically involve not loading the AdSense script at all
            // For an existing page, we can only hide the ad containers
            document.querySelectorAll('.ad-container').forEach(function(container) {
                container.style.display = 'none';
            });
        }
    }
}); 