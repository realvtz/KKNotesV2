/**
 * Core functionality for KKNotes Admin Dashboard
 * Handles initialization, authentication, and core features
 */

// Global state
let currentUser = null;
let isAdmin = false;
let isSuperAdmin = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    try {
        // Wait for Firebase to initialize
        await waitForFirebase();
        
        // Set up authentication listener
        firebase.auth().onAuthStateChanged(handleAuthStateChange);
        
        // Initialize UI components
        initializeUI();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

// Wait for Firebase to initialize
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        const checkFirebase = () => {
            if (typeof firebase !== 'undefined' && firebase.apps.length) {
                resolve();
            } else if (typeof firebase === 'undefined') {
                reject(new Error('Firebase is not loaded'));
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Handle authentication state changes
async function handleAuthStateChange(user) {
    try {
        if (user) {
            currentUser = user;
            isAdmin = await checkAdminAccess(user);
            isSuperAdmin = await checkSuperAdminAccess(user);
            
            if (isAdmin) {
                showDashboard();
                await loadDashboardData();
            } else {
                showAccessDenied();
            }
        } else {
            currentUser = null;
            isAdmin = false;
            isSuperAdmin = false;
            showLoginSection();
        }
    } catch (error) {
        console.error('Auth state change error:', error);
        showError('Authentication error');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Auth buttons
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Search
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Content tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });
    
    // Add content button
    const addContentBtn = document.getElementById('addContentBtn');
    if (addContentBtn) {
        addContentBtn.addEventListener('click', handleAddContent);
    }
    
    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Semester and subject selectors
    setupContentSelectors();
}

// Initialize UI components
function initializeUI() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeButton(savedTheme);
    
    // Initialize selectors
    initializeSelectors();
    
    // Load initial view
    const defaultView = document.querySelector('.nav-item');
    if (defaultView) {
        defaultView.click();
    }
}

// Initialize semester and subject selectors
function initializeSelectors() {
    const selectors = {
        notesSemester: document.getElementById('notesSemesterSelect'),
        notesSubject: document.getElementById('notesSubjectSelect'),
        videosSemester: document.getElementById('videosSemesterSelect'),
        videosSubject: document.getElementById('videosSubjectSelect')
    };
    
    // Populate semester selectors
    for (const selector of [selectors.notesSemester, selectors.videosSemester]) {
        if (selector) {
            for (let i = 1; i <= 8; i++) {
                const option = document.createElement('option');
                option.value = `s${i}`;
                option.textContent = `Semester ${i}`;
                selector.appendChild(option);
            }
        }
    }
    
    // Set up change listeners
    if (selectors.notesSemester) {
        selectors.notesSemester.addEventListener('change', () => {
            loadSubjectsForSemester(selectors.notesSemester.value, selectors.notesSubject);
            loadNotesData(document.querySelector('#notes-panel tbody'));
        });
    }
    
    if (selectors.videosSemester) {
        selectors.videosSemester.addEventListener('change', () => {
            loadSubjectsForSemester(selectors.videosSemester.value, selectors.videosSubject);
            loadVideosData(document.querySelector('#videos-panel tbody'));
        });
    }
    
    if (selectors.notesSubject) {
        selectors.notesSubject.addEventListener('change', () => {
            loadNotesData(document.querySelector('#notes-panel tbody'));
        });
    }
    
    if (selectors.videosSubject) {
        selectors.videosSubject.addEventListener('change', () => {
            loadVideosData(document.querySelector('#videos-panel tbody'));
        });
    }
}

// Load subjects for a semester
async function loadSubjectsForSemester(semester, selectElement) {
    try {
        const snapshot = await database.ref(`subjects/${semester}`).once('value');
        const subjects = snapshot.val() || [];
        
        // Clear existing options
        selectElement.innerHTML = '<option value="">Select Subject</option>';
        
        // Add new options
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.key;
            option.textContent = subject.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
        showError('Failed to load subjects');
    }
}

// Event Handlers
async function handleLogin() {
    // Use centralized auth state handler rather than implementing here
    if (window.authState && window.authState.showLogin) {
        window.authState.showLogin();
    } else {
        console.error('Auth state handler not available');
        showError('Login system unavailable');
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout failed');
    }
}

function handleNavigation(event) {
    event.preventDefault();
    
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Show corresponding section
    const targetId = event.currentTarget.getAttribute('href').substring(1);
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.toggle('active', section.id === targetId);
    });
    
    // Update breadcrumb
    updateBreadcrumb(event.currentTarget.querySelector('span').textContent);
    
    // Load section data if needed
    loadSectionData(targetId);
}

function handleTabChange(event) {
    const tabId = event.currentTarget.dataset.tab;
    
    // Update active state
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load content
    loadContentPanel(tabId);
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const activePanel = document.querySelector('.tab-panel.active');
    if (activePanel) {
        filterContent(activePanel, query);
    }
}

function handleAddContent() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        showAddContentModal(activeTab.dataset.tab);
    }
}

// Utility functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showError(message) {
    showToast(message, 'error');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    updateThemeButton(theme);
}

function updateThemeButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (button) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Export necessary functions
window.adminCore = {
    showToast,
    showError,
    handleLogin,
    handleLogout,
    loadSubjectsForSemester
}; 