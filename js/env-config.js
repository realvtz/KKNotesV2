// Environment configuration for Firebase
const FIREBASE_API_KEY = localStorage.getItem('FIREBASE_API_KEY') || "AIzaSyDSzgYbLym_x8DomEuOVVCeA4thW48IdGs";
const FIREBASE_PROJECT_ID = localStorage.getItem('FIREBASE_PROJECT_ID') || "kknotesadvanced";
const FIREBASE_APP_ID = localStorage.getItem('FIREBASE_APP_ID') || "1:388227934488:web:76d3d4117fac37ef26566d";
const FIREBASE_MESSAGING_SENDER_ID = localStorage.getItem('FIREBASE_MESSAGING_SENDER_ID') || "388227934488";

// Display error message if Firebase configuration is missing
if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID || !FIREBASE_APP_ID || !FIREBASE_MESSAGING_SENDER_ID) {
    console.error('Firebase configuration is missing. Please set the required environment variables.');
    
    // Show setup instructions if in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.info('Development setup: You can set Firebase config in localStorage for testing:');
        console.info('localStorage.setItem("FIREBASE_API_KEY", "your-api-key");');
        console.info('localStorage.setItem("FIREBASE_PROJECT_ID", "your-project-id");');
        console.info('localStorage.setItem("FIREBASE_APP_ID", "your-app-id");');
        console.info('localStorage.setItem("FIREBASE_MESSAGING_SENDER_ID", "your-messaging-sender-id");');
    }
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FIREBASE_API_KEY,
        FIREBASE_PROJECT_ID,
        FIREBASE_APP_ID,
        FIREBASE_MESSAGING_SENDER_ID
    };
}




