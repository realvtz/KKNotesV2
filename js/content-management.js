/**
 * Content Management Module
 * Handles all content-related functionality including semesters, subjects, notes, and videos
 */

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadTotalCounts(),
            loadRecentActivity(),
            loadActivityChart()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        window.adminCore.showError('Failed to load dashboard data');
    }
}

// Load total counts
async function loadTotalCounts() {
    try {
        // Load users count
        const usersSnapshot = await database.ref('users').once('value');
        const usersCount = Object.keys(usersSnapshot.val() || {}).length;
        document.getElementById('total-users-count').textContent = usersCount;
        
        // Load notes count
        const notesCount = await countAllContent('notes');
        document.getElementById('total-notes-count').textContent = notesCount;
        
        // Load videos count
        const videosCount = await countAllContent('videos');
        document.getElementById('total-videos-count').textContent = videosCount;
        
        // Load reports count
        const reportsSnapshot = await database.ref('reports').once('value');
        const reportsCount = Object.keys(reportsSnapshot.val() || {}).length;
        document.getElementById('total-reports-count').textContent = reportsCount;
    } catch (error) {
        console.error('Error loading counts:', error);
        throw error;
    }
}

// Count all content of a specific type
async function countAllContent(contentType) {
    try {
        const snapshot = await database.ref(contentType).once('value');
        const content = snapshot.val() || {};
        let count = 0;
        
        // Count items across all semesters and subjects
        Object.values(content).forEach(semester => {
            Object.values(semester).forEach(subject => {
                count += Object.keys(subject).length;
            });
        });
        
        return count;
    } catch (error) {
        console.error(`Error counting ${contentType}:`, error);
        return 0;
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const snapshot = await database.ref('activity')
            .orderByChild('timestamp')
            .limitToLast(10)
            .once('value');
            
        const activities = snapshot.val() || {};
        const activityData = Object.entries(activities).map(([id, activity]) => ({
            id,
            ...activity,
            date: new Date(activity.timestamp)
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        return activityData;
    } catch (error) {
        console.error('Error loading activity:', error);
        throw error;
    }
}

// Load activity chart
async function loadActivityChart() {
    try {
        const ctx = document.getElementById('activity-chart');
        if (!ctx) return;
        
        const activityData = await loadRecentActivity();
        const dates = [...new Set(activityData.map(a => 
            new Date(a.timestamp).toLocaleDateString()
        ))];
        
        const data = {
            labels: dates,
            datasets: [
                {
                    label: 'Notes Added',
                    data: dates.map(date => 
                        activityData.filter(a => 
                            new Date(a.timestamp).toLocaleDateString() === date && 
                            a.type === 'note_added'
                        ).length
                    ),
                    borderColor: '#4a90e2',
                    backgroundColor: '#4a90e280'
                },
                {
                    label: 'Videos Added',
                    data: dates.map(date => 
                        activityData.filter(a => 
                            new Date(a.timestamp).toLocaleDateString() === date && 
                            a.type === 'video_added'
                        ).length
                    ),
                    borderColor: '#27ae60',
                    backgroundColor: '#27ae6080'
                }
            ]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading activity chart:', error);
        throw error;
    }
}

// Load content panel
async function loadContentPanel(panelId) {
    const panel = document.getElementById(`${panelId}-panel`);
    if (!panel) return;
    
    const tableBody = panel.querySelector('tbody');
    if (!tableBody) return;
    
    try {
        switch (panelId) {
            case 'semesters':
                await loadSemestersData(tableBody);
                break;
            case 'subjects':
                await loadSubjectsData(tableBody);
                break;
            case 'notes':
                await loadNotesData(tableBody);
                break;
            case 'videos':
                await loadVideosData(tableBody);
                break;
        }
    } catch (error) {
        console.error(`Error loading ${panelId}:`, error);
        window.adminCore.showError(`Failed to load ${panelId}`);
    }
}

// Load semesters data
async function loadSemestersData(tableBody) {
    try {
        const snapshot = await database.ref('subjects').once('value');
        const subjects = snapshot.val() || {};
        
        if (Object.keys(subjects).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No semesters found. Add your first semester!</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        for (let i = 1; i <= 8; i++) {
            const semKey = `s${i}`;
            const semSubjects = subjects[semKey] || [];
            const contentCount = await countSemesterContent(semKey);
            
            html += `
                <tr>
                    <td>Semester ${i}</td>
                    <td>${semSubjects.length}</td>
                    <td>${contentCount}</td>
                    <td>
                        <button class="btn outline-btn" onclick="window.contentManagement.editSemester('${semKey}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading semesters:', error);
        showToast('Failed to load semesters', 'error');
    }
}

// Load subjects data
async function loadSubjectsData(tableBody) {
    try {
        const semester = document.getElementById('semesterSelect').value;
        if (!semester) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">Please select a semester</td>
                </tr>
            `;
            return;
        }
        
        const snapshot = await database.ref(`subjects/${semester}`).once('value');
        const subjects = snapshot.val() || [];
        
        if (subjects.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">No subjects found</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        for (const subject of subjects) {
            const contentCount = await countSubjectContent(semester, subject.key);
            html += `
                <tr>
                    <td>${subject.name}</td>
                    <td>${subject.code}</td>
                    <td>${contentCount}</td>
                    <td>
                        <button class="btn outline-btn" onclick="window.contentManagement.editSubject('${semester}', '${subject.key}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn outline-btn text-danger" onclick="window.contentManagement.deleteSubject('${semester}', '${subject.key}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading subjects:', error);
        showToast('Failed to load subjects', 'error');
    }
}

// Load notes data
async function loadNotesData(tableBody) {
    try {
        const semester = document.getElementById('notesSemesterSelect').value;
        const subject = document.getElementById('notesSubjectSelect').value;
        
        if (!semester || !subject) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">Please select a semester and subject</td>
                </tr>
            `;
            return;
        }
        
        const snapshot = await database.ref(`notes/${semester}/${subject}`).once('value');
        const notes = snapshot.val() || {};
        
        if (Object.keys(notes).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No notes found</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        for (const [id, note] of Object.entries(notes)) {
            html += `
                <tr>
                    <td>${note.title}</td>
                    <td>
                        <a href="${note.link}" target="_blank" class="link">
                            ${formatLink(note.link)}
                        </a>
                    </td>
                    <td>${formatDate(note.addedAt)}</td>
                    <td>${note.addedBy}</td>
                    <td>
                        <button class="btn outline-btn" onclick="window.contentManagement.editNote('${semester}', '${subject}', '${id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn outline-btn text-danger" onclick="window.contentManagement.deleteNote('${semester}', '${subject}', '${id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading notes:', error);
        showToast('Failed to load notes', 'error');
    }
}

// Load videos data
async function loadVideosData(tableBody) {
    try {
        const semester = document.getElementById('videosSemesterSelect').value;
        const subject = document.getElementById('videosSubjectSelect').value;
        
        if (!semester || !subject) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">Please select a semester and subject</td>
                </tr>
            `;
            return;
        }
        
        const snapshot = await database.ref(`videos/${semester}/${subject}`).once('value');
        const videos = snapshot.val() || {};
        
        if (Object.keys(videos).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No videos found</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        for (const [id, video] of Object.entries(videos)) {
            html += `
                <tr>
                    <td>
                        <div class="video-info">
                            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                            <span>${video.title}</span>
                        </div>
                    </td>
                    <td>
                        <a href="${video.link}" target="_blank" class="link">
                            ${formatLink(video.link)}
                        </a>
                    </td>
                    <td>${formatDate(video.addedAt)}</td>
                    <td>${video.addedBy}</td>
                    <td>
                        <button class="btn outline-btn" onclick="window.contentManagement.editVideo('${semester}', '${subject}', '${id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn outline-btn text-danger" onclick="window.contentManagement.deleteVideo('${semester}', '${subject}', '${id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading videos:', error);
        showToast('Failed to load videos', 'error');
    }
}

// Add content
async function addContent(contentType, data) {
    try {
        const { semester, subject } = data;
        delete data.semester;
        delete data.subject;
        
        // Add metadata
        data.addedBy = firebase.auth().currentUser.email;
        data.addedAt = firebase.database.ServerValue.TIMESTAMP;
        
        // Generate ID
        const newRef = database.ref(`${contentType}/${semester}/${subject}`).push();
        
        // If it's a video, extract video ID and generate thumbnail
        if (contentType === 'videos') {
            const videoId = extractYouTubeVideoId(data.link);
            if (videoId) {
                data.videoId = videoId;
                data.thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
        }
        
        // Save content
        await newRef.set(data);
        
        // Log activity
        await logActivity(`${contentType.slice(0, -1)}_added`, {
            semester,
            subject,
            contentId: newRef.key,
            title: data.title
        });
        
        window.adminCore.showToast('Content added successfully', 'success');
    } catch (error) {
        console.error('Error adding content:', error);
        throw error;
    }
}

// Edit content
async function editContent(contentType, semester, subject, id, data) {
    try {
        // Update content
        await database.ref(`${contentType}/${semester}/${subject}/${id}`).update(data);
        
        // Log activity
        await logActivity(`${contentType.slice(0, -1)}_edited`, {
            semester,
            subject,
            contentId: id,
            title: data.title
        });
        
        window.adminCore.showToast('Content updated successfully', 'success');
    } catch (error) {
        console.error('Error editing content:', error);
        throw error;
    }
}

// Delete content
async function deleteContent(contentType, semester, subject, id) {
    try {
        // Get content data for activity log
        const snapshot = await database.ref(`${contentType}/${semester}/${subject}/${id}`).once('value');
        const contentData = snapshot.val();
        
        // Delete content
        await database.ref(`${contentType}/${semester}/${subject}/${id}`).remove();
        
        // Log activity
        await logActivity(`${contentType.slice(0, -1)}_deleted`, {
            semester,
            subject,
            contentId: id,
            title: contentData.title
        });
        
        window.adminCore.showToast('Content deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting content:', error);
        throw error;
    }
}

// Utility functions
function formatLink(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname.slice(0, 20) + (urlObj.pathname.length > 20 ? '...' : '');
    } catch {
        return url.slice(0, 30) + (url.length > 30 ? '...' : '');
    }
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function extractYouTubeVideoId(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        return new URLSearchParams(urlObj.search).get('v');
    } catch {
        return null;
    }
}

async function logActivity(type, data) {
    try {
        await database.ref('activity').push({
            type,
            ...data,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userId: firebase.auth().currentUser.uid,
            userEmail: firebase.auth().currentUser.email
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

async function countSemesterContent(semester) {
    try {
        const [notesSnapshot, videosSnapshot] = await Promise.all([
            database.ref(`notes/${semester}`).once('value'),
            database.ref(`videos/${semester}`).once('value')
        ]);
        
        const notes = notesSnapshot.val() || {};
        const videos = videosSnapshot.val() || {};
        
        let count = 0;
        Object.values(notes).forEach(subject => {
            count += Object.keys(subject).length;
        });
        Object.values(videos).forEach(subject => {
            count += Object.keys(subject).length;
        });
        
        return count;
    } catch (error) {
        console.error('Error counting semester content:', error);
        return 0;
    }
}

async function countSubjectContent(semester, subject) {
    try {
        const [notesSnapshot, videosSnapshot] = await Promise.all([
            database.ref(`notes/${semester}/${subject}`).once('value'),
            database.ref(`videos/${semester}/${subject}`).once('value')
        ]);
        
        const notesCount = Object.keys(notesSnapshot.val() || {}).length;
        const videosCount = Object.keys(videosSnapshot.val() || {}).length;
        
        return notesCount + videosCount;
    } catch (error) {
        console.error('Error counting subject content:', error);
        return 0;
    }
}

// Export necessary functions
window.contentManagement = {
    loadDashboardData,
    loadContentPanel,
    addContent,
    editContent,
    deleteContent,
    editSemester: (semester) => {
        window.modals.showEditContentModal('semester', { semester });
    },
    editSubject: (semester, subject) => {
        window.modals.showEditContentModal('subject', { semester, subject });
    },
    deleteSubject: (semester, subject) => {
        window.modals.showDeleteConfirmModal('subject', { semester, subject }, 
            () => deleteContent('subjects', semester, null, subject));
    },
    editNote: (semester, subject, id) => {
        window.modals.showEditContentModal('note', { semester, subject, id });
    },
    deleteNote: (semester, subject, id) => {
        window.modals.showDeleteConfirmModal('note', { semester, subject, id }, 
            () => deleteContent('notes', semester, subject, id));
    },
    editVideo: (semester, subject, id) => {
        window.modals.showEditContentModal('video', { semester, subject, id });
    },
    deleteVideo: (semester, subject, id) => {
        window.modals.showDeleteConfirmModal('video', { semester, subject, id }, 
            () => deleteContent('videos', semester, subject, id));
    }
}; 