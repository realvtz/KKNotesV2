

document.addEventListener('DOMContentLoaded', () => {
    
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
    }
    
    
    const mobileNavLinks = document.querySelectorAll('.nav-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });
    
    
    document.addEventListener('click', (event) => {
        if (navLinks && navLinks.classList.contains('active') && 
            !navLinks.contains(event.target) && 
            !menuToggle.contains(event.target)) {
            navLinks.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
    
    
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const user = firebase.auth().currentUser;
            if (!user) {
                e.preventDefault();
                console.log('User not logged in, showing auth overlay');
                
                
                sessionStorage.setItem('redirectAfterLogin', 'admin.html');
                
                
                const authOverlay = document.getElementById('auth-overlay');
                if (authOverlay) {
                    authOverlay.classList.add('active');
                    document.body.classList.add('no-scroll');
                }
            }
        });
    });
    
    
    const shouldShowLogin = sessionStorage.getItem('showLoginOverlay');
    if (shouldShowLogin === 'true') {
        
        sessionStorage.removeItem('showLoginOverlay');
        
        
        const authOverlay = document.getElementById('auth-overlay');
        if (authOverlay) {
            console.log('Showing auth overlay after redirect');
            setTimeout(() => {
                authOverlay.classList.add('active');
                document.body.classList.add('no-scroll');
            }, 500); 
        }
    }
    
    
    const redirectTarget = sessionStorage.getItem('redirectAfterLogin');
    if (redirectTarget && firebase.auth().currentUser) {
        console.log('User is logged in, redirecting to:', redirectTarget);
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTarget;
    }
}); 
