/**
 * Navigation helpers for KKNotes
 * Handles navigation between pages and login redirections
 */

document.addEventListener('DOMContentLoaded', () => {
    // Handle admin link clicks to check authentication first
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const user = firebase.auth().currentUser;
            if (!user) {
                e.preventDefault();
                console.log('User not logged in, showing auth overlay');
                
                // Store redirect info
                sessionStorage.setItem('redirectAfterLogin', 'admin.html');
                
                // Show auth overlay
                const authOverlay = document.getElementById('auth-overlay');
                if (authOverlay) {
                    authOverlay.classList.add('active');
                    document.body.classList.add('no-scroll');
                }
            }
        });
    });
    
    // Check if we should show the login overlay (coming from admin page)
    const shouldShowLogin = sessionStorage.getItem('showLoginOverlay');
    if (shouldShowLogin === 'true') {
        // Remove the flag from sessionStorage
        sessionStorage.removeItem('showLoginOverlay');
        
        // Get auth overlay and show it
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) {
            console.log('Showing auth overlay after redirect');
            setTimeout(() => {
                authOverlay.classList.add('active');
                document.body.classList.add('no-scroll');
            }, 500); // Small delay to ensure the page has loaded
        }
    }
    
    // Check if we need to redirect after login
    const redirectTarget = sessionStorage.getItem('redirectAfterLogin');
    if (redirectTarget && firebase.auth().currentUser) {
        console.log('User is logged in, redirecting to:', redirectTarget);
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTarget;
    }
}); 