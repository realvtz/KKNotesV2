/**
 * Theme handling for KKNotes
 * Controls light/dark mode functionality
 */

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

// Initialize theme state
let currentTheme = localStorage.getItem('theme') || 'light';

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeTheme);
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

/**
 * Initialize the theme based on user preference or system preference
 */
function initializeTheme() {
    console.log('Initializing theme...');
    
    // Check if user has previously set a theme
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        currentTheme = 'dark';
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        currentTheme = 'light';
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
    
    // Add rotation animation
    if (themeToggle) {
        themeToggle.classList.add('rotate');
        setTimeout(() => {
            themeToggle.classList.remove('rotate');
        }, 500);
    }
} 