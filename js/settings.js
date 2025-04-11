/**
 * Settings Module
 * Handles platform settings and configuration
 */

// Default platform settings
const defaultSettings = {
    features: {
        darkMode: false,
        notifications: true,
        contentRatings: true,
        contentComments: true,
        contentSharing: true
    },
    security: {
        maxLoginAttempts: 5,
        sessionTimeout: 60, // minutes
        twoFactorAuth: false
    }
};

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    setupSettingsForm();
});

// Initialize settings
async function initializeSettings() {
    try {
        // Get current settings
        const snapshot = await database.ref('settings').once('value');
        const settings = snapshot.val() || defaultSettings;
        
        // Update form with current settings
        updateSettingsForm(settings);
        
        // Apply settings
        applySettings(settings);
        
        console.log('Settings initialized successfully');
    } catch (error) {
        console.error('Error initializing settings:', error);
        window.adminCore.showError('Failed to load settings');
    }
}

// Set up settings form
function setupSettingsForm() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData(form);
            const settings = {
                features: {
                    darkMode: formData.get('darkMode') === 'on',
                    notifications: formData.get('notifications') === 'on',
                    contentRatings: formData.get('contentRatings') === 'on',
                    contentComments: formData.get('contentComments') === 'on',
                    contentSharing: formData.get('contentSharing') === 'on'
                },
                security: {
                    maxLoginAttempts: parseInt(formData.get('maxLoginAttempts')) || 5,
                    sessionTimeout: parseInt(formData.get('sessionTimeout')) || 60,
                    twoFactorAuth: formData.get('twoFactorAuth') === 'on'
                }
            };
            
            // Save settings
            await saveSettings(settings);
            
            // Apply settings
            applySettings(settings);
            
            window.adminCore.showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            window.adminCore.showError('Failed to save settings');
        }
    });
    
    // Reset form
    form.addEventListener('reset', () => {
        setTimeout(() => updateSettingsForm(defaultSettings), 0);
    });
}

// Update settings form with values
function updateSettingsForm(settings) {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    
    // Update feature toggles
    Object.entries(settings.features).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.checked = value;
        }
    });
    
    // Update security settings
    Object.entries(settings.security).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;
            }
        }
    });
}

// Save settings to database
async function saveSettings(settings) {
    try {
        await database.ref('settings').set(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
}

// Apply settings to the platform
function applySettings(settings) {
    // Apply dark mode
    document.body.classList.toggle('dark-theme', settings.features.darkMode);
    
    // Apply other settings as needed
    if (settings.features.notifications) {
        setupNotifications();
    }
    
    if (settings.security.twoFactorAuth) {
        setup2FA();
    }
    
    // Update session timeout
    updateSessionTimeout(settings.security.sessionTimeout);
}

// Set up notifications
function setupNotifications() {
    // Implementation depends on notification system
    console.log('Setting up notifications...');
}

// Set up two-factor authentication
function setup2FA() {
    // Implementation depends on 2FA system
    console.log('Setting up 2FA...');
}

// Update session timeout
function updateSessionTimeout(timeout) {
    // Implementation depends on session management
    console.log('Updating session timeout:', timeout);
}

// Export necessary functions
window.settings = {
    defaultSettings,
    initializeSettings,
    saveSettings,
    applySettings
};