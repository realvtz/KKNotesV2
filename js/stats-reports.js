/**
 * Statistics and Reports Module
 * Handles all statistics, analytics, and report management functionality
 */

// Statistics Functions
async function loadStatistics() {
    try {
        // Load user statistics
        const userStats = await getUserStatistics();
        updateUserStatsUI(userStats);
        
        // Load content statistics
        const contentStats = await getContentStatistics();
        updateContentStatsUI(contentStats);
        
        // Load activity statistics
        const activityStats = await getActivityStatistics();
        updateActivityCharts(activityStats);
        
        // Load platform statistics
        const platformStats = await getPlatformStatistics();
        updatePlatformStatsUI(platformStats);
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Failed to load statistics', 'error');
    }
}

async function getUserStatistics() {
    const snapshot = await database.ref('users').once('value');
    const users = snapshot.val() || {};
    
    const stats = {
        totalUsers: Object.keys(users).length,
        activeUsers: 0,
        newUsersToday: 0,
        bannedUsers: 0
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    Object.values(users).forEach(user => {
        if (user.lastLogin > Date.now() - 7 * 24 * 60 * 60 * 1000) {
            stats.activeUsers++;
        }
        if (user.createdAt > today.getTime()) {
            stats.newUsersToday++;
        }
        if (user.status === 'banned') {
            stats.bannedUsers++;
        }
    });
    
    return stats;
}

async function getContentStatistics() {
    const stats = {
        totalNotes: 0,
        totalVideos: 0,
        totalResources: 0,
        contentBySubject: {}
    };
    
    // Count notes
    const notesSnapshot = await database.ref('notes').once('value');
    const notes = notesSnapshot.val() || {};
    Object.values(notes).forEach(semester => {
        Object.values(semester).forEach(subject => {
            const count = Object.keys(subject).length;
            stats.totalNotes += count;
            if (!stats.contentBySubject[subject]) {
                stats.contentBySubject[subject] = { notes: 0, videos: 0 };
            }
            stats.contentBySubject[subject].notes += count;
        });
    });
    
    // Count videos
    const videosSnapshot = await database.ref('videos').once('value');
    const videos = videosSnapshot.val() || {};
    Object.values(videos).forEach(semester => {
        Object.values(semester).forEach(subject => {
            const count = Object.keys(subject).length;
            stats.totalVideos += count;
            if (!stats.contentBySubject[subject]) {
                stats.contentBySubject[subject] = { notes: 0, videos: 0 };
            }
            stats.contentBySubject[subject].videos += count;
        });
    });
    
    return stats;
}

async function getActivityStatistics() {
    const stats = {
        dailyActiveUsers: [],
        contentUploads: [],
        userEngagement: []
    };
    
    // Get last 30 days of activity
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Get user activity
    const activitySnapshot = await database.ref('activity')
        .orderByChild('timestamp')
        .startAt(thirtyDaysAgo)
        .once('value');
    
    const activity = activitySnapshot.val() || {};
    
    // Process activity data
    Object.values(activity).forEach(action => {
        const date = new Date(action.timestamp).toLocaleDateString();
        
        if (!stats.dailyActiveUsers[date]) {
            stats.dailyActiveUsers[date] = new Set();
        }
        stats.dailyActiveUsers[date].add(action.userId);
        
        if (action.type === 'upload') {
            if (!stats.contentUploads[date]) {
                stats.contentUploads[date] = 0;
            }
            stats.contentUploads[date]++;
        }
        
        if (!stats.userEngagement[date]) {
            stats.userEngagement[date] = 0;
        }
        stats.userEngagement[date]++;
    });
    
    // Convert Sets to counts
    stats.dailyActiveUsers = Object.entries(stats.dailyActiveUsers).map(([date, users]) => ({
        date,
        count: users.size
    }));
    
    return stats;
}

async function getPlatformStatistics() {
    return {
        uptime: process.uptime(),
        lastBackup: await getLastBackupTime(),
        totalStorage: await calculateStorageUsed(),
        activeFeatures: await getActiveFeatures()
    };
}

// Reports Functions
async function loadReports(tableBody) {
    try {
        const snapshot = await database.ref('reports').once('value');
        const reports = snapshot.val() || {};
        
        if (Object.keys(reports).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-flag"></i>
                        <p>No reports found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        Object.entries(reports).forEach(([id, report]) => {
            html += `
                <tr>
                    <td>${formatDate(report.timestamp)}</td>
                    <td>${report.type}</td>
                    <td>${report.reportedBy}</td>
                    <td>
                        <div class="report-content">
                            <div class="report-title">${report.title}</div>
                            <div class="report-description">${report.description}</div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${getReportStatusBadge(report.status)}">
                            ${report.status}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${generateReportActions(id, report)}
                        </div>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading reports:', error);
        showToast('Failed to load reports', 'error');
    }
}

async function updateReportStatus(reportId, status) {
    try {
        await database.ref(`reports/${reportId}/status`).set(status);
        await database.ref(`reports/${reportId}/resolvedAt`).set(firebase.database.ServerValue.TIMESTAMP);
        await database.ref(`reports/${reportId}/resolvedBy`).set(firebase.auth().currentUser.email);
        
        showToast('Report status updated successfully', 'success');
        loadReports(document.querySelector('#reports-panel tbody'));
    } catch (error) {
        console.error('Error updating report status:', error);
        showToast('Failed to update report status', 'error');
    }
}

async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }
    
    try {
        await database.ref(`reports/${reportId}`).remove();
        showToast('Report deleted successfully', 'success');
        loadReports(document.querySelector('#reports-panel tbody'));
    } catch (error) {
        console.error('Error deleting report:', error);
        showToast('Failed to delete report', 'error');
    }
}

// UI Update Functions
function updateUserStatsUI(stats) {
    document.getElementById('total-users').textContent = stats.totalUsers;
    document.getElementById('active-users').textContent = stats.activeUsers;
    document.getElementById('new-users').textContent = stats.newUsersToday;
    document.getElementById('banned-users').textContent = stats.bannedUsers;
}

function updateContentStatsUI(stats) {
    document.getElementById('total-notes').textContent = stats.totalNotes;
    document.getElementById('total-videos').textContent = stats.totalVideos;
    document.getElementById('total-resources').textContent = stats.totalResources;
    
    // Update content by subject chart
    const ctx = document.getElementById('content-by-subject-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(stats.contentBySubject),
            datasets: [
                {
                    label: 'Notes',
                    data: Object.values(stats.contentBySubject).map(s => s.notes),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                },
                {
                    label: 'Videos',
                    data: Object.values(stats.contentBySubject).map(s => s.videos),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateActivityCharts(stats) {
    // Daily Active Users Chart
    const dauCtx = document.getElementById('daily-active-users-chart').getContext('2d');
    new Chart(dauCtx, {
        type: 'line',
        data: {
            labels: stats.dailyActiveUsers.map(d => d.date),
            datasets: [{
                label: 'Daily Active Users',
                data: stats.dailyActiveUsers.map(d => d.count),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Content Uploads Chart
    const uploadsCtx = document.getElementById('content-uploads-chart').getContext('2d');
    new Chart(uploadsCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(stats.contentUploads),
            datasets: [{
                label: 'Content Uploads',
                data: Object.values(stats.contentUploads),
                backgroundColor: 'rgba(153, 102, 255, 0.5)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updatePlatformStatsUI(stats) {
    document.getElementById('platform-uptime').textContent = formatUptime(stats.uptime);
    document.getElementById('last-backup').textContent = formatDate(stats.lastBackup);
    document.getElementById('storage-used').textContent = formatBytes(stats.totalStorage);
    
    const featuresList = document.getElementById('active-features');
    featuresList.innerHTML = stats.activeFeatures
        .map(feature => `<li class="feature-item">${feature}</li>`)
        .join('');
}

// Utility Functions
function getReportStatusBadge(status) {
    switch (status) {
        case 'pending':
            return 'warning-badge';
        case 'resolved':
            return 'success-badge';
        case 'rejected':
            return 'danger-badge';
        default:
            return 'info-badge';
    }
}

function generateReportActions(id, report) {
    if (report.status === 'resolved' || report.status === 'rejected') {
        return `
            <button class="btn outline-btn text-danger" onclick="deleteReport('${id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
    }
    
    return `
        <button class="btn outline-btn success" onclick="updateReportStatus('${id}', 'resolved')">
            <i class="fas fa-check"></i> Resolve
        </button>
        <button class="btn outline-btn danger" onclick="updateReportStatus('${id}', 'rejected')">
            <i class="fas fa-times"></i> Reject
        </button>
    `;
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Export functions
window.statsReports = {
    loadStatistics,
    loadReports,
    updateReportStatus,
    deleteReport
}; 