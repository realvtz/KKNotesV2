


document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme.js: DOM loaded, initializing theme handler');
    initThemeHandler();
});

function initThemeHandler() {
    
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    const html = document.documentElement;
    
    console.log('Theme toggle element found:', !!themeToggle);
    
    
    function getPreferredTheme() {
        
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            console.log('Using stored theme preference:', storedTheme);
            return storedTheme;
        }
        
        
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            console.log('Using device dark mode preference');
            return 'dark';
        }
        
        
        console.log('No preference found, defaulting to light theme');
        return 'light';
    }
    
    
    let currentTheme = getPreferredTheme();
    
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            console.log('Theme toggle clicked');
            toggleTheme();
        });
        console.log('Theme toggle event listener attached');
    } else {
        console.warn('Theme toggle button not found!');
    }
    
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleDeviceThemeChange);
    
    
    function handleDeviceThemeChange(e) {
        
        if (!localStorage.getItem('theme')) {
            currentTheme = e.matches ? 'dark' : 'light';
            console.log('Device theme changed to:', currentTheme);
            applyTheme(currentTheme);
        }
    }
    
    
    function applyTheme(theme) {
        console.log('Applying theme:', theme);
        
        
        html.setAttribute('data-theme', theme);
        
        
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        
        updateThemeIcons(theme);
    }
    
    
    function initializeTheme() {
        console.log('Initializing theme to:', currentTheme);
        
        
        applyTheme(currentTheme);
        
        
        setTimeout(() => {
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        }, 100);
    }
    
    
    function toggleTheme() {
        console.log('Toggling theme from:', currentTheme);
        
        if (currentTheme === 'light') {
            
            currentTheme = 'dark';
        } else {
            
            currentTheme = 'light';
        }
        
        console.log('New theme:', currentTheme);
        
        
        localStorage.setItem('theme', currentTheme);
        
        
        applyTheme(currentTheme);
        
        
        if (themeToggle) {
            themeToggle.classList.add('rotate');
            setTimeout(() => {
                themeToggle.classList.remove('rotate');
            }, 500);
        }
    }
    
    
    function updateThemeIcons(theme) {
        if (!themeIcon) return;
        
        console.log('Updating theme icon for:', theme);
        
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
    
    
    initializeTheme();
    
    
    window.KKTheme = {
        getPreferredTheme,
        toggleTheme,
        applyTheme,
        getCurrentTheme: () => currentTheme
    };
    
    console.log('Theme handler initialized successfully');
} 
