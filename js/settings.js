


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
        sessionTimeout: 60, 
        twoFactorAuth: false
    }
};


document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    setupSettingsForm();
});


async function initializeSettings() {
    try {
        
        const snapshot = await database.ref('settings').once('value');
        const settings = snapshot.val() || defaultSettings;
        
        
        updateSettingsForm(settings);
        
        
        applySettings(settings);
        
        console.log('Settings initialized successfully');
    } catch (error) {
        console.error('Error initializing settings:', error);
        window.adminCore.showError('Failed to load settings');
    }
}


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
            
            
            await saveSettings(settings);
            
            
            applySettings(settings);
            
            window.adminCore.showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            window.adminCore.showError('Failed to save settings');
        }
    });
    
    
    form.addEventListener('reset', () => {
        setTimeout(() => updateSettingsForm(defaultSettings), 0);
    });
}


function updateSettingsForm(settings) {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    
    
    Object.entries(settings.features).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.checked = value;
        }
    });
    
    
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


async function saveSettings(settings) {
    try {
        await database.ref('settings').set(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
}


function applySettings(settings) {
    
    document.body.classList.toggle('dark-theme', settings.features.darkMode);
    
    
    if (settings.features.notifications) {
        setupNotifications();
    }
    
    if (settings.security.twoFactorAuth) {
        setup2FA();
    }
    
    
    updateSessionTimeout(settings.security.sessionTimeout);
}


function setupNotifications() {
    
    console.log('Setting up notifications...');
}


function setup2FA() {
    
    console.log('Setting up 2FA...');
}


function updateSessionTimeout(timeout) {
    
    console.log('Updating session timeout:', timeout);
}


window.settings = {
    defaultSettings,
    initializeSettings,
    saveSettings,
    applySettings
};


