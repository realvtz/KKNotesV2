/**
 * Main JavaScript for KKNotesf
 * Handles core functionalities and initializations
 */

// DOM Elements
let mainThemeToggle = document.getElementById('theme-toggle');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
if (mainThemeToggle) mainThemeToggle.addEventListener('click', toggleTheme);
if (menuToggle) menuToggle.addEventListener('click', toggleMenu);

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing KKNotes application...');
    
    // Set up navigation scroll effect
    window.addEventListener('scroll', handleNavScroll);
    
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                    }
                }
            }
        });
    });
    
    // Initialize animations
    initializeAnimations();
    
    // Check if admin link should be visible based on auth state
    updateAdminLinkVisibility();
    
    // Update admin link visibility when auth state changes
    firebase.auth().onAuthStateChanged(() => {
        updateAdminLinkVisibility();
    });
    
    // Add direct event listener for login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Login button clicked from main.js');
            
            const authOverlay = document.getElementById('auth-overlay');
            if (authOverlay) {
                // Force display the auth overlay
                authOverlay.style.display = 'flex';
                authOverlay.style.opacity = '1';
                authOverlay.style.visibility = 'visible';
                authOverlay.classList.add('active');
                document.body.classList.add('no-scroll');
                
                // Reset the Google auth button
                const siteAuthBtn = document.getElementById('site-auth-btn');
                if (siteAuthBtn) {
                    siteAuthBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                    siteAuthBtn.disabled = false;
                }
            }
        });
    }
}

/**
 * Update the admin link visibility based on user's admin status
 */
function updateAdminLinkVisibility() {
    const adminLink = document.querySelector('.admin-link');
    if (!adminLink) return;
    
    // Check if authState is available from auth.js
    if (window.authState) {
        if (window.authState.isAdmin()) {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }
    } else {
        // If authState is not available, hide the admin link by default
        adminLink.classList.add('hidden');
    }
}

/**
 * Handle navigation scroll effect
 */
function handleNavScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

/**
 * Toggle the mobile menu
 */
function toggleMenu() {
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

/**
 * Initialize animations for page elements
 */
function initializeAnimations() {
    // Animate hero section elements
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('fade-in');
    }
    
    // Animate floating emojis
    const floatingEmojis = document.querySelectorAll('.floating-emoji');
    floatingEmojis.forEach((emoji, index) => {
        emoji.style.animationDelay = `${index * 0.2}s`;
    });
    
    // Add scroll-triggered animations
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Toggle theme between light and dark mode
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

/**
 * Get formatted date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted date string
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Handle errors with a user-friendly toast
 * @param {Error} error - The error object
 * @param {string} fallbackMessage - Fallback message if error doesn't have one
 */
function handleError(error, fallbackMessage = 'An error occurred') {
    console.error('Error:', error);
    
    const message = error.message || fallbackMessage;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast error-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="close-toast">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Add event listener to close button
    const closeBtn = toast.querySelector('.close-toast');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Helper function to add content-loaded animation class after loading
 * @param {HTMLElement} container - The container element with loaded content
 */
function applyContentLoadedAnimation(container) {
    if (!container) return;
    
    // Find all child elements that should animate
    const contentElements = container.querySelectorAll('.subjects-container, .notes-list, .videos-list, .notes-grid, .videos-grid');
    
    // Apply the animation class
    contentElements.forEach(element => {
        element.classList.add('content-loaded');
    });
}

// Add the function to the window object so it can be accessed from other modules
window.applyContentLoadedAnimation = applyContentLoadedAnimation;
