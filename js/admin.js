/**
 * KKNotes Admin Dashboard
 * Handles admin functionality for content and user management
 */

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const typeButtons = document.querySelectorAll('.type-btn');
const addContentForm = document.getElementById('addContentForm');
const addAdminForm = document.getElementById('addAdminForm');
const addSemSubForm = document.getElementById('addSemSubForm');
const contentList = document.getElementById('contentList');
const adminList = document.getElementById('adminList');
const semSubList = document.getElementById('semSubList');
const semesterSelect = document.getElementById('semester');
const subjectSelect = document.getElementById('subject');
const contentTypeSelect = document.getElementById('contentType');
const subjectSemesterSelect = document.getElementById('subjectSemester');
const adminSidebar = document.querySelector('.admin-sidebar');
const menuToggle = document.querySelector('.menu-toggle');

// Responsive state
let isMobile = window.innerWidth <= 768;

// Firebase Database References
const db = firebase.database();
const notesRef = db.ref('notes');
const videosRef = db.ref('videos');
const adminsRef = db.ref('admins');
const semestersRef = db.ref('semesters');
const subjectsRef = db.ref('subjects');

// Current state
let currentContentType = 'note';
let currentSemSubType = 'semester';
let editingContentId = null;
let editingAdminId = null;
let editingSemesterId = null;
let editingSubjectId = null;
let editingSemester = '';
let editingSubject = '';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // Check if user is admin
            const isAdmin = await checkAdminStatus(user.email);
            if (isAdmin) {
                initializeAdmin();
                initMobileAdminBehavior();
            } else {
                // Redirect non-admins
                window.location.href = 'index.html';
                alert('You do not have admin privileges.');
            }
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    });
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
});

/**
 * Handle window resize events
 */
function handleResize() {
    const wasItMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    // Only run if mobile state has changed
    if (wasItMobile !== isMobile) {
        if (isMobile) {
            initMobileAdminBehavior();
        } else {
            resetMobileAdminBehavior();
        }
    }
}

/**
 * Initialize mobile-specific behavior for admin panel
 */
function initMobileAdminBehavior() {
    console.log('Initializing mobile admin behavior');
    
    // Add mobile class to admin container
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
        adminContainer.classList.add('mobile-view');
    }
    
    // Setup menu toggle
    if (menuToggle && adminSidebar) {
        menuToggle.addEventListener('click', toggleAdminMenu);
    }
    
    // Add touch swipe detection for admin sidebar
    if (adminContainer) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        adminContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        adminContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleAdminSwipe();
        }, { passive: true });
        
        function handleAdminSwipe() {
            const swipeThreshold = 100; // minimum distance for swipe
            
            // Right to left swipe (close sidebar)
            if (touchEndX < touchStartX - swipeThreshold) {
                if (adminSidebar && adminSidebar.classList.contains('active')) {
                    adminSidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            }
            
            // Left to right swipe (open sidebar)
            if (touchEndX > touchStartX + swipeThreshold) {
                if (adminSidebar && !adminSidebar.classList.contains('active')) {
                    adminSidebar.classList.add('active');
                    document.body.classList.add('sidebar-open');
                }
            }
        }
    }
    
    // Make nav buttons close sidebar when clicked on mobile
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isMobile && adminSidebar) {
                adminSidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });
    
    // Add scroll indicators to scrollable lists
    const scrollableLists = document.querySelectorAll('.content-list, .admin-list, .sem-subject-list');
    scrollableLists.forEach(list => {
        if (list.scrollWidth > list.clientWidth) {
            list.classList.add('scrollable');
        }
    });
}

/**
 * Reset mobile behavior when switching to desktop
 */
function resetMobileAdminBehavior() {
    console.log('Resetting mobile admin behavior');
    
    // Remove mobile classes
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
        adminContainer.classList.remove('mobile-view');
    }
    
    // Reset sidebar state
    if (adminSidebar) {
        adminSidebar.classList.remove('active');
    }
    
    document.body.classList.remove('sidebar-open');
    
    // Remove scrollable classes
    const scrollableLists = document.querySelectorAll('.scrollable');
    scrollableLists.forEach(list => {
        list.classList.remove('scrollable');
    });
}

/**
 * Toggle the admin sidebar menu
 */
function toggleAdminMenu() {
    if (adminSidebar) {
        adminSidebar.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }
}

/**
 * Check if user has admin privileges
 * @param {string} email - User email
 */
async function checkAdminStatus(email) {
    try {
        const snapshot = await adminsRef.orderByChild('email').equalTo(email).once('value');
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Initialize admin dashboard
 */
function initializeAdmin() {
    // Setup navigation
    setupNavigation();
    
    // Load data from Firebase
    loadContent();       // Load notes/videos content
    loadAdmins();        // Load admin users
    loadSemesters();     // Load semester dropdown
    
    // Display fixed semesters and load subjects from Firebase
    loadSemestersAndSubjects();
    
    // Setup form submissions
    setupForms();
}

/**
 * Setup navigation and content type selection
 */
function setupNavigation() {
    // Panel navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPanel = document.getElementById(btn.dataset.panel);
            
            // Update active states
            navButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            targetPanel.classList.add('active');
        });
    });

    // Content type selection (Notes/Videos)
    const contentTypesBtns = document.querySelectorAll('#content-panel .type-btn');
    contentTypesBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentContentType = btn.dataset.type;
            contentTypesBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadContent();
        });
    });

    // Semester/Subject type selection
    const semSubTypesBtns = document.querySelectorAll('#sem-subject-panel .type-btn');
    semSubTypesBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentSemSubType = btn.dataset.type;
            semSubTypesBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadSemestersAndSubjects();
            toggleSemSubForm();
        });
    });

    // Content type dropdown change
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', () => {
            currentContentType = contentTypeSelect.value;
        });
    }

    // Semester change for loading subjects
    if (semesterSelect) {
        semesterSelect.addEventListener('change', () => {
            loadSubjects(semesterSelect.value);
        });
    }

    // Subject semester change
    if (subjectSemesterSelect) {
        subjectSemesterSelect.addEventListener('change', () => {
            // Load subjects for the selected semester in the subject form
            const selectedSemester = subjectSemesterSelect.value;
            if (selectedSemester) {
                // If we have a subject key dropdown, populate it with subjects from this semester
                const subjectKeySelect = document.getElementById('subjectKey');
                if (subjectKeySelect && !subjectKeySelect.disabled) {
                    loadSubjectKeys(selectedSemester, subjectKeySelect);
                }
            }
        });
    }
}

/**
 * Toggle between semester and subject form elements
 */
function toggleSemSubForm() {
    const semesterGroups = document.querySelectorAll('.semester-group');
    const subjectGroups = document.querySelectorAll('.subject-group');
    const formTitle = document.getElementById('semSubFormTitle');
    const btnText = document.getElementById('semSubBtnText');
    
    if (currentSemSubType === 'semester') {
        semesterGroups.forEach(el => el.style.display = 'block');
        subjectGroups.forEach(el => el.style.display = 'none');
        formTitle.textContent = 'Add New Semester';
        btnText.textContent = 'Add Semester';
    } else {
        semesterGroups.forEach(el => el.style.display = 'none');
        subjectGroups.forEach(el => el.style.display = 'block');
        formTitle.textContent = 'Add New Subject';
        btnText.textContent = 'Add Subject';
        loadSemesterOptions();
    }
}

/**
 * Setup form submissions
 */
function setupForms() {
    // Content form submission
    if (addContentForm) {
        addContentForm.addEventListener('submit', handleContentSubmit);
    }
    
    // Admin form submission
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', handleAdminSubmit);
    }
    
    // Semester/Subject form submission
    if (addSemSubForm) {
        addSemSubForm.addEventListener('submit', handleSemSubSubmit);
    }
}

/**
 * Load semesters into select dropdowns
 */
async function loadSemesters() {
    if (!semesterSelect) return;

    try {
        // Clear existing options
        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        
        // Add semester options from 1 to 8
        for (let i = 1; i <= 8; i++) {
            const semKey = `s${i}`;
            const semName = `Semester ${i}`;
            semesterSelect.innerHTML += `
                <option value="${semKey}">${semName}</option>
            `;
        }
    } catch (error) {
        console.error('Error loading semesters:', error);
        showToast('Failed to load semesters', 'error');
    }
}

/**
 * Load semester options for subject form
 */
async function loadSemesterOptions() {
    if (!subjectSemesterSelect) return;

    try {
        // Clear existing options
        subjectSemesterSelect.innerHTML = '<option value="">Select Semester</option>';
        
        // Add semester options from 1 to 8
        for (let i = 1; i <= 8; i++) {
            const semKey = `s${i}`;
            const semName = `Semester ${i}`;
            subjectSemesterSelect.innerHTML += `
                <option value="${semKey}">${semName}</option>
            `;
        }
    } catch (error) {
        console.error('Error loading semester options:', error);
        showToast('Failed to load semester options', 'error');
    }
}

/**
 * Load subjects for selected semester
 * @param {string} semester - Semester key
 */
async function loadSubjects(semester) {
    if (!subjectSelect) return;

    try {
        if (!semester) {
            subjectSelect.innerHTML = '<option value="">Select Subject</option>';
            return;
        }

        // Show loading state in the dropdown
        subjectSelect.innerHTML = '<option value="">Loading subjects...</option>';
        
        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        if (subjects.length === 0) {
            // If no subjects found, show message in the dropdown
            subjectSelect.innerHTML += `<option value="" disabled>No subjects found for this semester</option>`;
        } else {
            // Sort subjects by name for better usability
            subjects.sort((a, b) => a.name.localeCompare(b.name));
            
            // Add each subject to the dropdown
            subjects.forEach(subject => {
                if (subject && subject.key && subject.name) {
                    subjectSelect.innerHTML += `
                        <option value="${subject.key}">${subject.name}</option>
                    `;
                }
            });
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        showToast(`Failed to load subjects: ${error.message}`, 'error');
        // Set error state in dropdown
        subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }
}

/**
 * Handle content form submission (add/edit note or video)
 */
async function handleContentSubmit(e) {
    e.preventDefault();
    
    const contentType = contentTypeSelect.value;
    const semester = semesterSelect.value;
    const subject = subjectSelect.value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value || '';
    const link = document.getElementById('driveLink').value;

    if (!semester || !subject) {
        showToast('Please select both semester and subject', 'error');
        return;
    }

    try {
        const contentData = {
            title,
            description,
            link,
            addedBy: firebase.auth().currentUser.email,
            addedAt: firebase.database.ServerValue.TIMESTAMP
        };

        const ref = contentType === 'note' ? notesRef : videosRef;
        
        if (editingContentId) {
            // Update existing content
            await ref.child(`${semester}/${subject}/${editingContentId}`).update(contentData);
            showToast(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} updated successfully`, 'success');
            resetForm('content');
        } else {
            // Add new content
            await ref.child(`${semester}/${subject}`).push(contentData);
            showToast(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} added successfully`, 'success');
            addContentForm.reset();
        }
        
        loadContent();
    } catch (error) {
        console.error('Error saving content:', error);
        showToast('Failed to save content', 'error');
    }
}

/**
 * Load content list (notes or videos)
 */
async function loadContent() {
    if (!contentList) return;
    contentList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        // Determine the reference based on content type
        const ref = currentContentType === 'note' ? notesRef : videosRef;
        const snapshot = await ref.once('value');
        const content = snapshot.val() || {};

        // Container for content items
        let html = '';
        
        // Process nested content structure (semester -> subject -> content items)
        Object.entries(content).forEach(([semester, semesterData]) => {
            if (!semesterData) return; // Skip if semesterData is null
            
            Object.entries(semesterData).forEach(([subject, subjectData]) => {
                if (!subjectData) return; // Skip if subjectData is null
                
                Object.entries(subjectData).forEach(([id, item]) => {
                    if (!item) return; // Skip if item is null
                    
                    // Get semester name based on key
                    const semesterNumber = semester.replace('s', '');
                    const semesterName = `Semester ${semesterNumber}`;
                    
                    // Create content item card
                    html += `
                        <div class="content-item">
                            <div class="item-header">
                                <h3>${item.title || 'Untitled'}</h3>
                                <div class="item-badges">
                                    <span class="badge semester-badge">${semesterName}</span>
                                    <span class="badge subject-badge">${subject}</span>
                                </div>
                            </div>
                            <p class="item-description">${item.description || 'No description'}</p>
                            <div class="item-link">
                                <a href="${item.link || '#'}" target="_blank" class="drive-link">
                                    ${item.link ? item.link.substring(0, 50) + (item.link.length > 50 ? '...' : '') : 'No link provided'}
                                </a>
                            </div>
                            <div class="item-actions">
                                <button onclick="editContent('${currentContentType}', '${semester}', '${subject}', '${id}')" class="btn icon-btn edit-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteContent('${currentContentType}', '${semester}', '${subject}', '${id}')" class="btn icon-btn delete-btn">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            });
        });

        // Display content or empty message
        contentList.innerHTML = html || `<div class="empty-message">No ${currentContentType}s found</div>`;
    } catch (error) {
        console.error('Error loading content:', error);
        showToast(`Failed to load ${currentContentType}s: ${error.message}`, 'error');
        contentList.innerHTML = `<div class="error-message">Error loading ${currentContentType}s</div>`;
    }
}

/**
 * Edit content (note/video)
 */
async function editContent(type, semester, subject, id) {
    try {
        // Validate inputs
        if (!type || !semester || !subject || !id) {
            showToast('Invalid content parameters', 'error');
            return;
        }
        
        // Set editing state
        editingContentId = id;
        editingSemester = semester;
        editingSubject = subject;
        
        // Get content reference
        const ref = type === 'note' ? notesRef : videosRef;
        const snapshot = await ref.child(`${semester}/${subject}/${id}`).once('value');
        
        if (!snapshot.exists()) {
            showToast('Content not found in database', 'error');
            return;
        }
        
        const content = snapshot.val();
        
        // Set form values
        contentTypeSelect.value = type;
        semesterSelect.value = semester;
        
        // Load subjects for the selected semester
        await loadSubjects(semester);
        
        if (!subjectSelect.querySelector(`option[value="${subject}"]`)) {
            // If subject doesn't exist in dropdown, add it temporarily
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        }
        
        // Continue setting form values
        subjectSelect.value = subject;
        document.getElementById('title').value = content.title || '';
        document.getElementById('description').value = content.description || '';
        document.getElementById('driveLink').value = content.link || '';

        // Update submit button text
        const submitBtn = addContentForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fas fa-save"></i> Update ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        }

        // Scroll to form
        addContentForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading content for edit:', error);
        showToast(`Failed to load content for editing: ${error.message}`, 'error');
        resetForm('content'); // Reset form in case of error
    }
}

/**
 * Delete content (note/video)
 */
async function deleteContent(type, semester, subject, id) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
        const ref = type === 'note' ? notesRef : videosRef;
        await ref.child(`${semester}/${subject}/${id}`).remove();
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
        loadContent();
    } catch (error) {
        console.error('Error deleting content:', error);
        showToast('Failed to delete content', 'error');
    }
}

/**
 * Handle admin form submission (add/edit)
 */
async function handleAdminSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.toLowerCase();
    const nickname = document.getElementById('adminNickname').value;

    try {
        const adminData = {
            email,
            nickname,
            addedBy: firebase.auth().currentUser.email,
            addedAt: firebase.database.ServerValue.TIMESTAMP
        };

        if (editingAdminId) {
            // Update existing admin
            await adminsRef.child(editingAdminId).update(adminData);
            showToast('Admin updated successfully', 'success');
            resetForm('admin');
        } else {
            // Check if admin already exists
            const snapshot = await adminsRef.orderByChild('email').equalTo(email).once('value');
            if (snapshot.exists()) {
                showToast('This email is already registered as an admin', 'error');
                return;
            }

            // Add new admin
            await adminsRef.push(adminData);
            showToast('Admin added successfully', 'success');
            addAdminForm.reset();
        }
        
        loadAdmins();
    } catch (error) {
        console.error('Error saving admin:', error);
        showToast('Failed to save admin', 'error');
    }
}

/**
 * Load admin list
 */
async function loadAdmins() {
    if (!adminList) return;
    adminList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const snapshot = await adminsRef.once('value');
        const admins = snapshot.val() || {};

        let html = '';
        Object.entries(admins).forEach(([id, admin]) => {
            html += `
                <div class="admin-item">
                    <div class="item-header">
                        <h3>${admin.nickname || 'Admin'}</h3>
                    </div>
                    <div class="item-email">${admin.email}</div>
                    <div class="item-meta">Added by: ${admin.addedBy || 'System'}</div>
                    <div class="item-actions">
                        <button onclick="editAdmin('${id}')" class="btn icon-btn edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteAdmin('${id}')" class="btn icon-btn delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        adminList.innerHTML = html || '<div class="empty-message">No admins found</div>';
    } catch (error) {
        console.error('Error loading admins:', error);
        showToast('Failed to load admins', 'error');
        adminList.innerHTML = '<div class="error-message">Error loading admins</div>';
    }
}

/**
 * Edit admin
 */
async function editAdmin(id) {
    try {
        // Set editing state
        editingAdminId = id;
        
        // Get admin data
        const snapshot = await adminsRef.child(id).once('value');
        const admin = snapshot.val();

        if (!admin) {
            showToast('Admin not found', 'error');
            return;
        }

        // Set form values
        document.getElementById('adminEmail').value = admin.email;
        document.getElementById('adminNickname').value = admin.nickname || '';

        // Update submit button text
        const submitBtn = addAdminForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Admin';
        }

        // Scroll to form
        addAdminForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading admin for edit:', error);
        showToast('Failed to load admin for editing', 'error');
    }
}

/**
 * Delete admin
 */
async function deleteAdmin(id) {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
        // Check if admin is the current user
        const snapshot = await adminsRef.child(id).once('value');
        const admin = snapshot.val();
        
        if (admin && admin.email === firebase.auth().currentUser.email) {
            showToast('You cannot remove yourself as an admin', 'error');
            return;
        }
        
        await adminsRef.child(id).remove();
        showToast('Admin removed successfully', 'success');
        loadAdmins();
    } catch (error) {
        console.error('Error removing admin:', error);
        showToast('Failed to remove admin', 'error');
    }
}

/**
 * Handle semester/subject form submission
 */
async function handleSemSubSubmit(e) {
    e.preventDefault();
    
    try {
        if (currentSemSubType === 'semester') {
            // We don't need to add/edit semesters as they are fixed
            showToast('Semesters are fixed from Semester 1 to Semester 8', 'info');
            resetForm('semsub');
        } else {
            const semester = document.getElementById('subjectSemester').value;
            const subjectName = document.getElementById('subjectName').value;
            const subjectKey = document.getElementById('subjectKey').value;
            
            if (!semester) {
                showToast('Please select a semester', 'error');
                return;
            }
            
            if (editingSubjectId) {
                // Update existing subject
                const existingSubjects = await getSubjectsArray(semester);
                const updatedSubjects = existingSubjects.map(sub => {
                    if (sub.key === subjectKey) {
                        return { key: subjectKey, name: subjectName };
                    }
                    return sub;
                });
                
                await subjectsRef.child(semester).set(updatedSubjects);
                showToast('Subject updated successfully', 'success');
            } else {
                // Get existing subjects for this semester
                const existingSubjects = await getSubjectsArray(semester);
                
                // Check if subject key already exists
                if (existingSubjects.some(sub => sub.key === subjectKey)) {
                    showToast('A subject with this key already exists in this semester', 'error');
                    return;
                }
                
                // Add new subject
                existingSubjects.push({ key: subjectKey, name: subjectName });
                await subjectsRef.child(semester).set(existingSubjects);
                showToast('Subject added successfully', 'success');
            }
        }
        
        // Reset form and reload data
        resetForm('semsub');
        loadSemestersAndSubjects();
        
        // If in content panel, also reload the subject dropdown
        if (semesterSelect && semesterSelect.value) {
            loadSubjects(semesterSelect.value);
        }
    } catch (error) {
        console.error('Error saving semester/subject:', error);
        showToast('Failed to save data', 'error');
    }
}

/**
 * Get subjects array for a semester
 * @param {string} semester - Semester key
 */
async function getSubjectsArray(semester) {
    try {
        const snapshot = await subjectsRef.child(semester).once('value');
        return snapshot.val() || [];
    } catch (error) {
        console.error('Error getting subjects:', error);
        return [];
    }
}

/**
 * Load semesters and subjects
 */
async function loadSemestersAndSubjects() {
    if (!semSubList) return;
    semSubList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        if (currentSemSubType === 'semester') {
            // Load fixed list of semesters from 1 to 8
            let html = '';
            for (let i = 1; i <= 8; i++) {
                const semKey = `s${i}`;
                const semName = `Semester ${i}`;
                html += `
                    <div class="semsub-item">
                        <div class="item-header">
                            <h3>${semName}</h3>
                            <div class="item-key">${semKey}</div>
                        </div>
                        <div class="item-actions">
                            <button onclick="editSemester('${semKey}')" class="btn icon-btn edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteSemester('${semKey}')" class="btn icon-btn delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            semSubList.innerHTML = html;
        } else {
            // Load subjects
            const snapshot = await subjectsRef.once('value');
            const semesterSubjects = snapshot.val() || {};
            
            let html = '';
            let promises = [];
            
            Object.entries(semesterSubjects).forEach(([semester, subjects]) => {
                // Get semester name from key (e.g., 's1' -> 'Semester 1')
                const semNumber = semester.replace('s', '');
                const semesterName = `Semester ${semNumber}`;
                
                subjects.forEach(subject => {
                    html += `
                        <div class="semsub-item">
                            <div class="item-header">
                                <h3>${subject.name}</h3>
                                <div class="item-badges">
                                    <span class="badge semester-badge">${semesterName}</span>
                                    <span class="badge subject-badge">${subject.key}</span>
                                </div>
                            </div>
                            <div class="item-actions">
                                <button onclick="editSubject('${semester}', '${subject.key}')" class="btn icon-btn edit-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteSubject('${semester}', '${subject.key}')" class="btn icon-btn delete-btn">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            });
            
            // Update the HTML
            semSubList.innerHTML = html || '<div class="empty-message">No subjects found</div>';
        }
    } catch (error) {
        console.error('Error loading semesters/subjects:', error);
        showToast('Failed to load data', 'error');
        semSubList.innerHTML = '<div class="error-message">Error loading data</div>';
    }
}

/**
 * Edit semester
 */
async function editSemester(key) {
    try {
        editingSemesterId = key;
        
        // Extract semester number from key (e.g., 's1' -> '1')
        const semNumber = key.replace('s', '');
        const name = `Semester ${semNumber}`;
        
        document.getElementById('semesterName').value = name;
        document.getElementById('semesterKey').value = key;
        document.getElementById('semesterKey').disabled = true; // Can't change key
        
        // Update button text
        const btnText = document.getElementById('semSubBtnText');
        btnText.textContent = 'Update Semester';
        
        // Scroll to form
        addSemSubForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading semester for edit:', error);
        showToast('Failed to load semester for editing', 'error');
    }
}

/**
 * Delete semester
 */
async function deleteSemester(key) {
    if (!confirm(`Are you sure you want to delete all data for ${key}? This will delete all subjects and content for this semester.`)) return;

    try {
        // We don't delete the semester itself since we're using a fixed list,
        // but we do delete all subjects and content associated with it
        
        // Remove all subjects for this semester
        await subjectsRef.child(key).remove();
        
        // Remove all notes and videos for this semester
        await notesRef.child(key).remove();
        await videosRef.child(key).remove();
        
        showToast('All data for this semester has been deleted successfully', 'success');
        loadSemestersAndSubjects();
    } catch (error) {
        console.error('Error deleting semester data:', error);
        showToast('Failed to delete semester data', 'error');
    }
}

/**
 * Edit subject
 */
async function editSubject(semester, key) {
    try {
        editingSubjectId = key;
        
        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        const subject = subjects.find(s => s.key === key);
        
        if (!subject) {
            showToast('Subject not found', 'error');
            return;
        }
        
        // Switch to subject tab if not already there
        if (currentSemSubType !== 'subject') {
            const subjectTabBtn = document.querySelector('#sem-subject-panel .type-btn[data-type="subject"]');
            if (subjectTabBtn) {
                subjectTabBtn.click();
            }
        }
        
        document.getElementById('subjectSemester').value = semester;
        document.getElementById('subjectName').value = subject.name;
        document.getElementById('subjectKey').value = key;
        document.getElementById('subjectKey').disabled = true; // Can't change key
        
        // Update button text
        const btnText = document.getElementById('semSubBtnText');
        btnText.textContent = 'Update Subject';
        
        // Scroll to form
        addSemSubForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading subject for edit:', error);
        showToast('Failed to load subject for editing', 'error');
    }
}

/**
 * Delete subject
 */
async function deleteSubject(semester, key) {
    if (!confirm(`Are you sure you want to delete subject ${key} from semester ${semester}? This will also delete all associated content.`)) return;

    try {
        // Get existing subjects
        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        
        // Check if subject exists
        if (!subjects.some(s => s.key === key)) {
            showToast('Subject not found', 'error');
            return;
        }
        
        // Filter out the subject to delete
        const updatedSubjects = subjects.filter(s => s.key !== key);
        
        // Update subjects list
        await subjectsRef.child(semester).set(updatedSubjects);
        
        // Remove all notes and videos for this subject
        await notesRef.child(semester).child(key).remove();
        await videosRef.child(semester).child(key).remove();
        
        showToast('Subject and all associated content deleted successfully', 'success');
        loadSemestersAndSubjects();
        
        // If in content panel, also reload the subject dropdown
        if (semesterSelect && semesterSelect.value === semester) {
            loadSubjects(semester);
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
        showToast(`Failed to delete subject: ${error.message}`, 'error');
    }
}

/**
 * Reset forms
 * @param {string} formType - Type of form to reset
 */
function resetForm(formType) {
    switch (formType) {
        case 'content':
            editingContentId = null;
            editingSemester = '';
            editingSubject = '';
            addContentForm.reset();
            document.getElementById('contentType').value = currentContentType;
            
            // Reset submit button text
            const contentBtn = addContentForm.querySelector('button[type="submit"]');
            if (contentBtn) {
                contentBtn.innerHTML = '<i class="fas fa-plus"></i> Add Content';
            }
            break;
            
        case 'admin':
            editingAdminId = null;
            addAdminForm.reset();
            
            // Reset submit button text
            const adminBtn = addAdminForm.querySelector('button[type="submit"]');
            if (adminBtn) {
                adminBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Admin';
            }
            break;
            
        case 'semsub':
            editingSemesterId = null;
            editingSubjectId = null;
            addSemSubForm.reset();
            
            // Re-enable key fields
            document.getElementById('semesterKey').disabled = false;
            
            const subjectKeyElement = document.getElementById('subjectKey');
            if (subjectKeyElement) {
                subjectKeyElement.disabled = false;
                subjectKeyElement.innerHTML = '<option value="">Enter Subject Key</option>';
            }
            
            // Reset button text
            const btnText = document.getElementById('semSubBtnText');
            btnText.textContent = currentSemSubType === 'semester' ? 'Add Semester' : 'Add Subject';
            
            // Reload form fields
            toggleSemSubForm();
            break;
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

/**
 * Load subject keys for selected semester into a select element
 * @param {string} semester - Semester key
 * @param {HTMLSelectElement} selectElement - The select element to populate
 */
async function loadSubjectKeys(semester, selectElement) {
    try {
        if (!semester) {
            selectElement.innerHTML = '<option value="">Enter Subject Key</option>';
            return;
        }

        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        
        // Save current value if exists
        const currentValue = selectElement.value;
        
        // Clear and add default option
        selectElement.innerHTML = '<option value="">Enter Subject Key</option>';
        
        // Add each subject as an option
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.key;
            option.textContent = `${subject.key} - ${subject.name}`;
            selectElement.appendChild(option);
        });
        
        // Restore selected value if it exists in new options
        if (currentValue) {
            selectElement.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading subject keys:', error);
        showToast('Failed to load subject keys', 'error');
    }
}

// Export functions to window for HTML buttons
window.editContent = editContent;
window.deleteContent = deleteContent;
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;
window.editSemester = editSemester;
window.deleteSemester = deleteSemester;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.resetForm = resetForm;
