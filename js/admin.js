


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


let isMobile = window.innerWidth <= 768;


const db = firebase.database();
const notesRef = db.ref('notes');
const videosRef = db.ref('videos');
const adminsRef = db.ref('admins');
const semestersRef = db.ref('semesters');
const subjectsRef = db.ref('subjects');


let currentContentType = 'note';
let currentSemSubType = 'semester';
let editingContentId = null;
let editingAdminId = null;
let editingSemesterId = null;
let editingSubjectId = null;
let editingSemester = '';
let editingSubject = '';


document.addEventListener('DOMContentLoaded', () => {
    
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            
            const isAdmin = await checkAdminStatus(user.email);
            if (isAdmin) {
                initializeAdmin();
                initMobileAdminBehavior();
            } else {
                
                window.location.href = 'index.html';
                alert('You do not have admin privileges.');
            }
        } else {
            
            window.location.href = 'index.html';
        }
    });
    
    
    window.addEventListener('resize', handleResize);
});


function handleResize() {
    const wasItMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    
    if (wasItMobile !== isMobile) {
        if (isMobile) {
            initMobileAdminBehavior();
        } else {
            resetMobileAdminBehavior();
        }
    }
}


function initMobileAdminBehavior() {
    console.log('Initializing mobile admin behavior');
    
    
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
        adminContainer.classList.add('mobile-view');
    }
    
    
    if (menuToggle && adminSidebar) {
        menuToggle.addEventListener('click', toggleAdminMenu);
    }
    
    
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
            const swipeThreshold = 100; 
            
            
            if (touchEndX < touchStartX - swipeThreshold) {
                if (adminSidebar && adminSidebar.classList.contains('active')) {
                    adminSidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            }
            
            
            if (touchEndX > touchStartX + swipeThreshold) {
                if (adminSidebar && !adminSidebar.classList.contains('active')) {
                    adminSidebar.classList.add('active');
                    document.body.classList.add('sidebar-open');
                }
            }
        }
    }
    
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isMobile && adminSidebar) {
                adminSidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });
    
    
    const scrollableLists = document.querySelectorAll('.content-list, .admin-list, .sem-subject-list');
    scrollableLists.forEach(list => {
        if (list.scrollWidth > list.clientWidth) {
            list.classList.add('scrollable');
        }
    });
}


function resetMobileAdminBehavior() {
    console.log('Resetting mobile admin behavior');
    
    
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
        adminContainer.classList.remove('mobile-view');
    }
    
    
    if (adminSidebar) {
        adminSidebar.classList.remove('active');
    }
    
    document.body.classList.remove('sidebar-open');
    
    
    const scrollableLists = document.querySelectorAll('.scrollable');
    scrollableLists.forEach(list => {
        list.classList.remove('scrollable');
    });
}


function toggleAdminMenu() {
    if (adminSidebar) {
        adminSidebar.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }
}


async function checkAdminStatus(email) {
    try {
        const snapshot = await adminsRef.orderByChild('email').equalTo(email).once('value');
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}


function initializeAdmin() {
    
    setupNavigation();
    
    
    loadContent();       
    loadAdmins();        
    loadSemesters();     
    
    
    loadSemestersAndSubjects();
    
    
    setupForms();
}


function setupNavigation() {
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPanel = document.getElementById(btn.dataset.panel);
            
            
            navButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            targetPanel.classList.add('active');
        });
    });

    
    const contentTypesBtns = document.querySelectorAll('#content-panel .type-btn');
    contentTypesBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentContentType = btn.dataset.type;
            contentTypesBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadContent();
        });
    });

    
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

    
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', () => {
            currentContentType = contentTypeSelect.value;
        });
    }

    
    if (semesterSelect) {
        semesterSelect.addEventListener('change', () => {
            loadSubjects(semesterSelect.value);
        });
    }

    
    if (subjectSemesterSelect) {
        subjectSemesterSelect.addEventListener('change', () => {
            
            const selectedSemester = subjectSemesterSelect.value;
            if (selectedSemester) {
                
                const subjectKeySelect = document.getElementById('subjectKey');
                if (subjectKeySelect && !subjectKeySelect.disabled) {
                    loadSubjectKeys(selectedSemester, subjectKeySelect);
                }
            }
        });
    }
}


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


function setupForms() {
    
    if (addContentForm) {
        addContentForm.addEventListener('submit', handleContentSubmit);
    }
    
    
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', handleAdminSubmit);
    }
    
    
    if (addSemSubForm) {
        addSemSubForm.addEventListener('submit', handleSemSubSubmit);
    }
}


async function loadSemesters() {
    if (!semesterSelect) return;

    try {
        
        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        
        
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


async function loadSemesterOptions() {
    if (!subjectSemesterSelect) return;

    try {
        
        subjectSemesterSelect.innerHTML = '<option value="">Select Semester</option>';
        
        
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


async function loadSubjects(semester) {
    if (!subjectSelect) return;

    try {
        if (!semester) {
            subjectSelect.innerHTML = '<option value="">Select Subject</option>';
            return;
        }

        
        subjectSelect.innerHTML = '<option value="">Loading subjects...</option>';
        
        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        if (subjects.length === 0) {
            
            subjectSelect.innerHTML += `<option value="" disabled>No subjects found for this semester</option>`;
        } else {
            
            subjects.sort((a, b) => a.name.localeCompare(b.name));
            
            
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
        
        subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }
}


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
            
            await ref.child(`${semester}/${subject}/${editingContentId}`).update(contentData);
            showToast(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} updated successfully`, 'success');
            resetForm('content');
        } else {
            
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


async function loadContent() {
    if (!contentList) return;
    contentList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        
        const ref = currentContentType === 'note' ? notesRef : videosRef;
        const snapshot = await ref.once('value');
        const content = snapshot.val() || {};

        
        let html = '';
        
        
        Object.entries(content).forEach(([semester, semesterData]) => {
            if (!semesterData) return; 
            
            Object.entries(semesterData).forEach(([subject, subjectData]) => {
                if (!subjectData) return; 
                
                Object.entries(subjectData).forEach(([id, item]) => {
                    if (!item) return; 
                    
                    
                    const semesterNumber = semester.replace('s', '');
                    const semesterName = `Semester ${semesterNumber}`;
                    
                    
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

        
        contentList.innerHTML = html || `<div class="empty-message">No ${currentContentType}s found</div>`;
    } catch (error) {
        console.error('Error loading content:', error);
        showToast(`Failed to load ${currentContentType}s: ${error.message}`, 'error');
        contentList.innerHTML = `<div class="error-message">Error loading ${currentContentType}s</div>`;
    }
}


async function editContent(type, semester, subject, id) {
    try {
        
        if (!type || !semester || !subject || !id) {
            showToast('Invalid content parameters', 'error');
            return;
        }
        
        
        editingContentId = id;
        editingSemester = semester;
        editingSubject = subject;
        
        
        const ref = type === 'note' ? notesRef : videosRef;
        const snapshot = await ref.child(`${semester}/${subject}/${id}`).once('value');
        
        if (!snapshot.exists()) {
            showToast('Content not found in database', 'error');
            return;
        }
        
        const content = snapshot.val();
        
        
        contentTypeSelect.value = type;
        semesterSelect.value = semester;
        
        
        await loadSubjects(semester);
        
        if (!subjectSelect.querySelector(`option[value="${subject}"]`)) {
            
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        }
        
        
        subjectSelect.value = subject;
        document.getElementById('title').value = content.title || '';
        document.getElementById('description').value = content.description || '';
        document.getElementById('driveLink').value = content.link || '';

        
        const submitBtn = addContentForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fas fa-save"></i> Update ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        }

        
        addContentForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading content for edit:', error);
        showToast(`Failed to load content for editing: ${error.message}`, 'error');
        resetForm('content'); 
    }
}


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
            
            await adminsRef.child(editingAdminId).update(adminData);
            showToast('Admin updated successfully', 'success');
            resetForm('admin');
        } else {
            
            const snapshot = await adminsRef.orderByChild('email').equalTo(email).once('value');
            if (snapshot.exists()) {
                showToast('This email is already registered as an admin', 'error');
                return;
            }

            
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


async function editAdmin(id) {
    try {
        
        editingAdminId = id;
        
        
        const snapshot = await adminsRef.child(id).once('value');
        const admin = snapshot.val();

        if (!admin) {
            showToast('Admin not found', 'error');
            return;
        }

        
        document.getElementById('adminEmail').value = admin.email;
        document.getElementById('adminNickname').value = admin.nickname || '';

        
        const submitBtn = addAdminForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Admin';
        }

        
        addAdminForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading admin for edit:', error);
        showToast('Failed to load admin for editing', 'error');
    }
}


async function deleteAdmin(id) {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
        
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


async function handleSemSubSubmit(e) {
    e.preventDefault();
    
    try {
        if (currentSemSubType === 'semester') {
            
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
                
                const existingSubjects = await getSubjectsArray(semester);
                
                
                if (existingSubjects.some(sub => sub.key === subjectKey)) {
                    showToast('A subject with this key already exists in this semester', 'error');
                    return;
                }
                
                
                existingSubjects.push({ key: subjectKey, name: subjectName });
                await subjectsRef.child(semester).set(existingSubjects);
                showToast('Subject added successfully', 'success');
            }
        }
        
        
        resetForm('semsub');
        loadSemestersAndSubjects();
        
        
        if (semesterSelect && semesterSelect.value) {
            loadSubjects(semesterSelect.value);
        }
    } catch (error) {
        console.error('Error saving semester/subject:', error);
        showToast('Failed to save data', 'error');
    }
}


async function getSubjectsArray(semester) {
    try {
        const snapshot = await subjectsRef.child(semester).once('value');
        return snapshot.val() || [];
    } catch (error) {
        console.error('Error getting subjects:', error);
        return [];
    }
}


async function loadSemestersAndSubjects() {
    if (!semSubList) return;
    semSubList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        if (currentSemSubType === 'semester') {
            
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
            
            const snapshot = await subjectsRef.once('value');
            const semesterSubjects = snapshot.val() || {};
            
            let html = '';
            let promises = [];
            
            Object.entries(semesterSubjects).forEach(([semester, subjects]) => {
                
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
            
            
            semSubList.innerHTML = html || '<div class="empty-message">No subjects found</div>';
        }
    } catch (error) {
        console.error('Error loading semesters/subjects:', error);
        showToast('Failed to load data', 'error');
        semSubList.innerHTML = '<div class="error-message">Error loading data</div>';
    }
}


async function editSemester(key) {
    try {
        editingSemesterId = key;
        
        
        const semNumber = key.replace('s', '');
        const name = `Semester ${semNumber}`;
        
        document.getElementById('semesterName').value = name;
        document.getElementById('semesterKey').value = key;
        document.getElementById('semesterKey').disabled = true; 
        
        
        const btnText = document.getElementById('semSubBtnText');
        btnText.textContent = 'Update Semester';
        
        
        addSemSubForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading semester for edit:', error);
        showToast('Failed to load semester for editing', 'error');
    }
}


async function deleteSemester(key) {
    if (!confirm(`Are you sure you want to delete all data for ${key}? This will delete all subjects and content for this semester.`)) return;

    try {
        
        
        
        
        await subjectsRef.child(key).remove();
        
        
        await notesRef.child(key).remove();
        await videosRef.child(key).remove();
        
        showToast('All data for this semester has been deleted successfully', 'success');
        loadSemestersAndSubjects();
    } catch (error) {
        console.error('Error deleting semester data:', error);
        showToast('Failed to delete semester data', 'error');
    }
}


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
        
        
        if (currentSemSubType !== 'subject') {
            const subjectTabBtn = document.querySelector('#sem-subject-panel .type-btn[data-type="subject"]');
            if (subjectTabBtn) {
                subjectTabBtn.click();
            }
        }
        
        document.getElementById('subjectSemester').value = semester;
        document.getElementById('subjectName').value = subject.name;
        document.getElementById('subjectKey').value = key;
        document.getElementById('subjectKey').disabled = true; 
        
        
        const btnText = document.getElementById('semSubBtnText');
        btnText.textContent = 'Update Subject';
        
        
        addSemSubForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading subject for edit:', error);
        showToast('Failed to load subject for editing', 'error');
    }
}


async function deleteSubject(semester, key) {
    if (!confirm(`Are you sure you want to delete subject ${key} from semester ${semester}? This will also delete all associated content.`)) return;

    try {
        
        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        
        
        if (!subjects.some(s => s.key === key)) {
            showToast('Subject not found', 'error');
            return;
        }
        
        
        const updatedSubjects = subjects.filter(s => s.key !== key);
        
        
        await subjectsRef.child(semester).set(updatedSubjects);
        
        
        await notesRef.child(semester).child(key).remove();
        await videosRef.child(semester).child(key).remove();
        
        showToast('Subject and all associated content deleted successfully', 'success');
        loadSemestersAndSubjects();
        
        
        if (semesterSelect && semesterSelect.value === semester) {
            loadSubjects(semester);
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
        showToast(`Failed to delete subject: ${error.message}`, 'error');
    }
}


function resetForm(formType) {
    switch (formType) {
        case 'content':
            editingContentId = null;
            editingSemester = '';
            editingSubject = '';
            addContentForm.reset();
            document.getElementById('contentType').value = currentContentType;
            
            
            const contentBtn = addContentForm.querySelector('button[type="submit"]');
            if (contentBtn) {
                contentBtn.innerHTML = '<i class="fas fa-plus"></i> Add Content';
            }
            break;
            
        case 'admin':
            editingAdminId = null;
            addAdminForm.reset();
            
            
            const adminBtn = addAdminForm.querySelector('button[type="submit"]');
            if (adminBtn) {
                adminBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Admin';
            }
            break;
            
        case 'semsub':
            editingSemesterId = null;
            editingSubjectId = null;
            addSemSubForm.reset();
            
            
            document.getElementById('semesterKey').disabled = false;
            
            const subjectKeyElement = document.getElementById('subjectKey');
            if (subjectKeyElement) {
                subjectKeyElement.disabled = false;
                subjectKeyElement.innerHTML = '<option value="">Enter Subject Key</option>';
            }
            
            
            const btnText = document.getElementById('semSubBtnText');
            btnText.textContent = currentSemSubType === 'semester' ? 'Add Semester' : 'Add Subject';
            
            
            toggleSemSubForm();
            break;
    }
}


function showToast(message, type = 'info') {
    
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    
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
    
    
    document.body.appendChild(toast);
    
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}


async function loadSubjectKeys(semester, selectElement) {
    try {
        if (!semester) {
            selectElement.innerHTML = '<option value="">Enter Subject Key</option>';
            return;
        }

        const snapshot = await subjectsRef.child(semester).once('value');
        const subjects = snapshot.val() || [];
        
        
        const currentValue = selectElement.value;
        
        
        selectElement.innerHTML = '<option value="">Enter Subject Key</option>';
        
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.key;
            option.textContent = `${subject.key} - ${subject.name}`;
            selectElement.appendChild(option);
        });
        
        
        if (currentValue) {
            selectElement.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading subject keys:', error);
        showToast('Failed to load subject keys', 'error');
    }
}


window.editContent = editContent;
window.deleteContent = deleteContent;
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;
window.editSemester = editSemester;
window.deleteSemester = deleteSemester;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.resetForm = resetForm;

