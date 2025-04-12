


let mainThemeToggle = document.getElementById('theme-toggle');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
let isMobile = window.innerWidth <= 768;


document.addEventListener('DOMContentLoaded', function() {
    console.log("Mobile sidebar navigation setup");
    
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Menu toggle clicked - opening sidebar");
            openSidebar();
        });
    } else {
        console.error("Menu toggle button not found!");
    }
    
    
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 70; 
    
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    
    function handleSwipe() {
        
        if (touchStartX - touchEndX > swipeThreshold && !navLinks.classList.contains('active')) {
            openSidebar();
        }
        
        
        if (touchEndX - touchStartX > swipeThreshold && navLinks.classList.contains('active')) {
            closeSidebar();
        }
    }
    
    
    function openSidebar() {
        console.log("Opening sidebar");
        if (!navLinks) {
            console.error("Nav links element not found!");
            return;
        }
        
        navLinks.classList.add('active');
        document.body.classList.add('menu-open');
        
        
        if (!navLinks.querySelector('.sidebar-header')) {
            setupSidebarStructure();
        }
    }
    
    
    function setupSidebarStructure() {
        console.log("Setting up sidebar structure");
        
        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'sidebar-header';
        
        
        const sidebarTitle = document.createElement('div');
        sidebarTitle.className = 'sidebar-title';
        
        
        const logoElement = document.querySelector('.logo');
        if (logoElement) {
            const logo = logoElement.cloneNode(true);
            sidebarTitle.appendChild(logo);
        }
        
        
        const titleText = document.createElement('span');
        titleText.textContent = 'KKNotes';
        sidebarTitle.appendChild(titleText);
        
        
        const closeButton = document.createElement('button');
        closeButton.className = 'sidebar-close';
        closeButton.setAttribute('aria-label', 'Close menu');
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        
        
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
        
        
        sidebarHeader.appendChild(sidebarTitle);
        sidebarHeader.appendChild(closeButton);
        
        
        const links = navLinks.querySelectorAll('a');
        
        
        const iconMap = {
            'Home': 'fa-home',
            'Notes': 'fa-book-open',
            'Videos': 'fa-video',
            'Chat': 'fa-comments',
            'About': 'fa-info-circle',
            'Admin': 'fa-lock'
        };
        
        
        links.forEach(link => {
            const text = link.textContent.trim();
            const icon = iconMap[text] || 'fa-link';
            
            
            if (!link.querySelector('i')) {
                link.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
            }
            
            
            link.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
        
        
        const sidebarFooter = document.createElement('div');
        sidebarFooter.className = 'sidebar-footer';
        
        
        const navDivider = document.createElement('div');
        navDivider.className = 'nav-divider';
        
        
        navLinks.insertBefore(sidebarHeader, navLinks.firstChild);
        navLinks.appendChild(navDivider);
        navLinks.appendChild(sidebarFooter);
        
        
        try {
            firebase.auth().onAuthStateChanged(user => {
                updateSidebarUserProfile(user, sidebarFooter);
            });
        } catch (error) {
            console.error("Error setting up auth listener:", error);
        }
    }
    
    
    function closeSidebar() {
        console.log("Closing sidebar");
        if (!navLinks) {
            console.error("Nav links element not found!");
            return;
        }
        
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    
    function updateSidebarUserProfile(user, footerElement) {
        if (!footerElement) return;
        
        
        footerElement.innerHTML = '';
        
        if (user) {
            
            const userProfile = document.createElement('div');
            userProfile.className = 'sidebar-user-profile';
            
            
            const userAvatar = document.createElement('img');
            userAvatar.src = user.photoURL || 'assets/avatars/default-avatar.png';
            userAvatar.alt = 'User profile';
            userProfile.appendChild(userAvatar);
            
            
            const userInfo = document.createElement('div');
            userInfo.className = 'sidebar-user-info';
            
            const userName = document.createElement('div');
            userName.className = 'sidebar-user-name';
            userName.textContent = user.displayName || 'User';
            userInfo.appendChild(userName);
            
            const userAction = document.createElement('div');
            userAction.className = 'sidebar-user-action';
            userAction.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
            userAction.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    firebase.auth().signOut().then(() => {
                        closeSidebar();
                    }).catch(error => {
                        console.error('Sign out error:', error);
                    });
                } catch (error) {
                    console.error("Error signing out:", error);
                }
            });
            userInfo.appendChild(userAction);
            
            userProfile.appendChild(userInfo);
            footerElement.appendChild(userProfile);
        } else {
            
            const loginButton = document.createElement('button');
            loginButton.className = 'btn primary-btn';
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            loginButton.style.width = '100%';
            loginButton.style.marginTop = 'var(--spacing-md)';
            
            loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeSidebar();
                
                
                setTimeout(() => {
                    const authOverlay = document.getElementById('auth-overlay');
                    if (authOverlay) {
                        authOverlay.classList.add('active');
                        document.body.classList.add('no-scroll');
                    }
                }, 300);
            });
            
            footerElement.appendChild(loginButton);
        }
    }
    
    
    window.openSidebar = openSidebar;
    window.closeSidebar = closeSidebar;
    window.setupSidebarStructure = setupSidebarStructure;
    
    
    document.addEventListener('click', function(event) {
        
        if (navLinks && 
            navLinks.classList.contains('active') && 
            !navLinks.contains(event.target) && 
            !event.target.classList.contains('menu-toggle') &&
            !event.target.closest('.menu-toggle')) {
            closeSidebar();
        }
    });
    
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
            closeSidebar();
        }
    });

    
    initializeApp();
});


window.addEventListener('resize', handleResize);


function initializeApp() {
    console.log('Initializing KKNotes application...');
    
    
    window.addEventListener('scroll', handleNavScroll);
    
    
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
                    
                    
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                    }
                }
            }
        });
    });
    
    
    initializeAnimations();
    
    
    updateAdminLinkVisibility();
    
    
    firebase.auth().onAuthStateChanged(() => {
        updateAdminLinkVisibility();
    });
    
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Login button clicked from main.js');
            
            const authOverlay = document.getElementById('auth-overlay');
            if (authOverlay) {
                
                authOverlay.style.display = 'flex';
                authOverlay.style.opacity = '1';
                authOverlay.style.visibility = 'visible';
                authOverlay.classList.add('active');
                document.body.classList.add('no-scroll');
                
                
                const siteAuthBtn = document.getElementById('site-auth-btn');
                if (siteAuthBtn) {
                    siteAuthBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                    siteAuthBtn.disabled = false;
                }
            }
        });
    }
    
    
    if (isMobile) {
        initMobileBehavior();
    }
    
    
    checkSystemDarkModePreference();
}


function checkSystemDarkModePreference() {
    console.log('Checking system dark mode preference from main.js');
    
    
    if (window.KKTheme) {
        console.log('KKTheme is available, skipping theme check in main.js');
        return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    
    
    if (savedTheme) {
        console.log('Using saved theme preference:', savedTheme);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-theme', 'light');
        }
        return;
    }
    
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log('System prefers dark mode, applying dark theme');
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
        
    } else {
        console.log('System prefers light mode or no preference detected');
        document.body.classList.remove('dark-mode');
        document.documentElement.setAttribute('data-theme', 'light');
    }
}


function handleResize() {
    const wasItMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    
    if (wasItMobile !== isMobile) {
        if (isMobile) {
            initMobileBehavior();
        } else {
            resetMobileBehavior();
        }
    }
}


function initMobileBehavior() {
    console.log('Initializing mobile behavior');
    
    
    if (menuToggle) {
        
        const openSidebarHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Menu toggle clicked from mobile behavior");
            
            
            if (typeof window.openSidebar === 'function') {
                window.openSidebar();
            } else {
                console.error("openSidebar function not available - falling back to class toggle");
                
                if (navLinks) {
                    navLinks.classList.add('active');
                    document.body.classList.add('menu-open');
                }
            }
        };
        
        
        menuToggle.removeEventListener('click', openSidebarHandler);
        menuToggle.addEventListener('click', openSidebarHandler);
    } else {
        console.error("Menu toggle button not found in initMobileBehavior");
    }
    
    
    const scrollableElements = document.querySelectorAll('.semester-tabs, .subjects-list');
    scrollableElements.forEach(element => {
        if (!element.classList.contains('mobile-scrollable')) {
            element.classList.add('mobile-scrollable');
        }
    });
    
    
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.classList.add('mobile-spaced');
    }
}


function resetMobileBehavior() {
    console.log('Resetting mobile behavior');
    
    
    const mobileElements = document.querySelectorAll('.mobile-scrollable');
    mobileElements.forEach(element => {
        element.classList.remove('mobile-scrollable');
        
        
        const indicators = element.querySelectorAll('.scroll-indicator');
        indicators.forEach(indicator => indicator.remove());
    });
}


function updateAdminLinkVisibility() {
    const adminLink = document.querySelector('.admin-link');
    if (!adminLink) return;
    
    
    if (window.authState) {
        if (window.authState.isAdmin()) {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }
    } else {
        
        adminLink.classList.add('hidden');
    }
}


function handleNavScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}


function initializeAnimations() {
    
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('fade-in');
    }
    
    
    const floatingEmojis = document.querySelectorAll('.floating-emoji');
    floatingEmojis.forEach((emoji, index) => {
        emoji.style.animationDelay = `${index * 0.2}s`;
    });
    
    
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


function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


function handleError(error, fallbackMessage = 'An error occurred') {
    console.error('Error:', error);
    
    const message = error.message || fallbackMessage;
    
    
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
    
    
    document.body.appendChild(toast);
    
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    
    const closeBtn = toast.querySelector('.close-toast');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    
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


function applyContentLoadedAnimation(container) {
    if (!container) return;
    
    
    const contentElements = container.querySelectorAll('.subjects-container, .notes-list, .videos-list, .notes-grid, .videos-grid');
    
    
    contentElements.forEach(element => {
        element.classList.add('content-loaded');
    });
}


window.applyContentLoadedAnimation = applyContentLoadedAnimation;

