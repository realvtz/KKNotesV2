


async function loadUsers(tableBody) {
    try {
        const snapshot = await database.ref('users').once('value');
        const users = snapshot.val() || {};
        
        if (Object.keys(users).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        Object.entries(users).forEach(([uid, user]) => {
            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <img src="${user.photoURL || 'assets/default-avatar.png'}" alt="${user.displayName}" class="user-avatar">
                            <div>
                                <div class="user-name">${user.displayName}</div>
                                <div class="user-email">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${getRoleBadgeClass(user.role)}">
                            ${formatRole(user.role)}
                        </span>
                    </td>
                    <td>${formatDate(user.lastLogin)}</td>
                    <td>${user.status || 'Active'}</td>
                    <td>
                        <div class="action-buttons">
                            ${generateUserActions(uid, user)}
                        </div>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

async function loadAdmins(tableBody) {
    try {
        const snapshot = await database.ref('admins').once('value');
        const admins = snapshot.val() || {};
        
        if (Object.keys(admins).length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-user-shield"></i>
                        <p>No admins found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        Object.entries(admins).forEach(([uid, admin]) => {
            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <img src="${admin.photoURL || 'assets/default-avatar.png'}" alt="${admin.displayName}" class="user-avatar">
                            <div>
                                <div class="user-name">${admin.displayName}</div>
                                <div class="user-email">${admin.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${admin.superAdmin ? 'super-admin-badge' : 'admin-badge'}">
                            ${admin.superAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                    </td>
                    <td>${formatDate(admin.addedAt)}</td>
                    <td>
                        <div class="action-buttons">
                            ${generateAdminActions(uid, admin)}
                        </div>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading admins:', error);
        showToast('Failed to load admins', 'error');
    }
}


async function promoteToAdmin(uid) {
    try {
        const userSnapshot = await database.ref(`users/${uid}`).once('value');
        const user = userSnapshot.val();
        
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        const adminData = {
            uid: uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            superAdmin: false,
            addedAt: firebase.database.ServerValue.TIMESTAMP,
            addedBy: firebase.auth().currentUser.email
        };
        
        await database.ref(`admins/${uid}`).set(adminData);
        await database.ref(`users/${uid}/role`).set('admin');
        
        showToast('User promoted to admin successfully', 'success');
        loadUsers(document.querySelector('#users-panel tbody'));
        loadAdmins(document.querySelector('#admins-panel tbody'));
    } catch (error) {
        console.error('Error promoting user to admin:', error);
        showToast('Failed to promote user to admin', 'error');
    }
}

async function promoteToSuperAdmin(uid) {
    if (!window.authState.isSuperAdmin()) {
        showToast('Only super admins can promote to super admin', 'error');
        return;
    }
    
    try {
        const adminSnapshot = await database.ref(`admins/${uid}`).once('value');
        const admin = adminSnapshot.val();
        
        if (!admin) {
            showToast('Admin not found', 'error');
            return;
        }
        
        await database.ref(`admins/${uid}/superAdmin`).set(true);
        await database.ref(`users/${uid}/role`).set('superadmin');
        
        showToast('Admin promoted to super admin successfully', 'success');
        loadAdmins(document.querySelector('#admins-panel tbody'));
    } catch (error) {
        console.error('Error promoting admin to super admin:', error);
        showToast('Failed to promote to super admin', 'error');
    }
}

async function demoteAdmin(uid) {
    if (!window.authState.isSuperAdmin()) {
        showToast('Only super admins can demote admins', 'error');
        return;
    }
    
    try {
        const adminSnapshot = await database.ref(`admins/${uid}`).once('value');
        const admin = adminSnapshot.val();
        
        if (!admin) {
            showToast('Admin not found', 'error');
            return;
        }
        
        if (admin.superAdmin) {
            showToast('Cannot demote super admin', 'error');
            return;
        }
        
        await database.ref(`admins/${uid}`).remove();
        await database.ref(`users/${uid}/role`).set('user');
        
        showToast('Admin demoted successfully', 'success');
        loadUsers(document.querySelector('#users-panel tbody'));
        loadAdmins(document.querySelector('#admins-panel tbody'));
    } catch (error) {
        console.error('Error demoting admin:', error);
        showToast('Failed to demote admin', 'error');
    }
}


async function banUser(uid) {
    try {
        await database.ref(`users/${uid}/status`).set('banned');
        showToast('User banned successfully', 'success');
        loadUsers(document.querySelector('#users-panel tbody'));
    } catch (error) {
        console.error('Error banning user:', error);
        showToast('Failed to ban user', 'error');
    }
}

async function unbanUser(uid) {
    try {
        await database.ref(`users/${uid}/status`).set('active');
        showToast('User unbanned successfully', 'success');
        loadUsers(document.querySelector('#users-panel tbody'));
    } catch (error) {
        console.error('Error unbanning user:', error);
        showToast('Failed to unban user', 'error');
    }
}

async function muteUser(uid, duration) {
    try {
        const mutedUntil = Date.now() + duration;
        await database.ref(`users/${uid}/muted`).set(mutedUntil);
        showToast('User muted successfully', 'success');
        loadUsers(document.querySelector('#users-panel tbody'));
    } catch (error) {
        console.error('Error muting user:', error);
        showToast('Failed to mute user', 'error');
    }
}

async function unmuteUser(uid) {
    try {
        await database.ref(`users/${uid}/muted`).remove();
        showToast('User unmuted successfully', 'success');
        loadUsers(document.querySelector('#users-panel tbody'));
    } catch (error) {
        console.error('Error unmuting user:', error);
        showToast('Failed to unmute user', 'error');
    }
}


function getRoleBadgeClass(role) {
    switch (role) {
        case 'superadmin':
            return 'super-admin-badge';
        case 'admin':
            return 'admin-badge';
        default:
            return 'user-badge';
    }
}

function formatRole(role) {
    switch (role) {
        case 'superadmin':
            return 'Super Admin';
        case 'admin':
            return 'Admin';
        default:
            return 'User';
    }
}

function generateUserActions(uid, user) {
    const actions = [];
    
    if (user.status === 'banned') {
        actions.push(`
            <button class="btn outline-btn" onclick="unbanUser('${uid}')">
                <i class="fas fa-user-check"></i> Unban
            </button>
        `);
    } else {
        if (user.role === 'user') {
            actions.push(`
                <button class="btn outline-btn" onclick="promoteToAdmin('${uid}')">
                    <i class="fas fa-user-shield"></i> Make Admin
                </button>
            `);
        }
        
        if (!user.muted) {
            actions.push(`
                <button class="btn outline-btn" onclick="muteUser('${uid}', 3600000)">
                    <i class="fas fa-microphone-slash"></i> Mute
                </button>
            `);
        } else {
            actions.push(`
                <button class="btn outline-btn" onclick="unmuteUser('${uid}')">
                    <i class="fas fa-microphone"></i> Unmute
                </button>
            `);
        }
        
        actions.push(`
            <button class="btn outline-btn text-danger" onclick="banUser('${uid}')">
                <i class="fas fa-ban"></i> Ban
            </button>
        `);
    }
    
    return actions.join('');
}

function generateAdminActions(uid, admin) {
    
    if (admin.superAdmin) {
        return '';
    }
    
    
    if (!window.authState.isSuperAdmin()) {
        return `
            <button class="btn outline-btn" onclick="promoteToSuperAdmin('${uid}')" disabled title="Only Super Admins can promote to Super Admin">
                <i class="fas fa-crown"></i> Make Super Admin
            </button>
            <button class="btn outline-btn text-danger" onclick="demoteAdmin('${uid}')" disabled title="Only Super Admins can remove Admins">
                <i class="fas fa-user-minus"></i> Remove Admin
            </button>
        `;
    }
    
    
    return `
        <button class="btn outline-btn" onclick="promoteToSuperAdmin('${uid}')">
            <i class="fas fa-crown"></i> Make Super Admin
        </button>
        <button class="btn outline-btn text-danger" onclick="demoteAdmin('${uid}')">
            <i class="fas fa-user-minus"></i> Remove Admin
        </button>
    `;
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


window.userManagement = {
    loadUsers,
    loadAdmins,
    promoteToAdmin,
    promoteToSuperAdmin,
    demoteAdmin,
    banUser,
    unbanUser,
    muteUser,
    unmuteUser
}; 


