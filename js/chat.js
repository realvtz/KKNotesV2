
(function() {
    'use strict';
    
    
    var chatMessages;
    var chatForm;
    var chatInput;
    var chatLoginBtn;
    var chatUserInfo;
    var chatLoginContainer;
    var chatAuthRequired;

    
    var isChatAdmin = false;
    var isChatSuperAdmin = false;

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        
        init();
    }

    
    function init() {
        console.log('Chat: Initializing module');
        
        chatMessages = document.getElementById('chat-messages');
        chatForm = document.getElementById('chat-form');
        chatInput = document.getElementById('chat-input');
        chatLoginBtn = document.getElementById('chat-login-btn');
        chatUserInfo = document.getElementById('chat-user-info');
        chatLoginContainer = document.querySelector('.chat-login');
        chatAuthRequired = document.getElementById('chat-auth-required');
        
        
        initializeEventListeners();
        
        
        document.addEventListener('firebase-connected', onFirebaseConnected);
        document.addEventListener('firebase-connection-failed', onFirebaseConnectionFailed);
        
        
        initializeChat();
    }

    
    function initializeEventListeners() {
        if (chatForm) {
            chatForm.addEventListener('submit', handleChatSubmit);
        }
        
        if (chatLoginBtn) {
            chatLoginBtn.addEventListener('click', handleChatLogin);
        }
    }

    
    function initializeChat() {
        console.log('Chat: Setting up auth monitoring');
        
        
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                
                console.log('Chat: User is signed in');
                
                
                checkChatAdminStatus(user);
                
                
                showChatForm(user);
                
                
                loadChatMessages();
            } else {
                
                console.log('Chat: User is signed out');
                
                
                if (chatForm) chatForm.classList.add('hidden');
                if (chatLoginContainer) chatLoginContainer.classList.remove('hidden');
                
                
                isChatAdmin = false;
                isChatSuperAdmin = false;
                
                
                loadChatMessages();
                
                
                if (chatAuthRequired) chatAuthRequired.classList.remove('hidden');
            }
        });
    }
    
    
    function onFirebaseConnected() {
        console.log('Chat: Firebase connection established, loading messages');
        if (chatMessages) {
            loadChatMessages();
        }
    }

    
    function onFirebaseConnectionFailed() {
        console.error('Chat: Firebase connection failed');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="chat-empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to connect to chat service. Please check your internet connection and try again later.</p>
                </div>
            `;
        }
    }

    
    function checkChatAdminStatus(user) {
        if (!user) return;
        
        const email = user.email;
        
        
        if (email === 'christopherjoshy4@gmail.com') {
            console.log('Chat: User is super admin (permanent)');
            isChatAdmin = true;
            isChatSuperAdmin = true;
            updateChatAdminUI();
            return;
        }
        
        
        database.ref('admins').once('value')
            .then(function(snapshot) {
                const admins = snapshot.val();
                if (admins) {
                    const adminKeys = Object.keys(admins);
                    for (const key of adminKeys) {
                        if (admins[key].email === email) {
                            console.log('Chat: User is admin');
                            isChatAdmin = true;
                            
                            
                            if (admins[key].superAdmin) {
                                console.log('Chat: User is super admin');
                                isChatSuperAdmin = true;
                            }
                            
                            
                            updateChatAdminUI();
                            return;
                        }
                    }
                }
                
                console.log('Chat: User is not an admin');
                isChatAdmin = false;
                isChatSuperAdmin = false;
                updateChatAdminUI();
            })
            .catch(function(error) {
                console.error('Error checking chat admin status:', error);
            });
    }

    
    function updateChatAdminUI() {
        if (chatUserInfo) {
            const user = firebase.auth().currentUser;
            if (user) {
                let adminBadge = '';
                if (isChatSuperAdmin) {
                    adminBadge = '<span class="admin-badge">Super Admin</span>';
                } else if (isChatAdmin) {
                    adminBadge = '<span class="admin-badge">Admin</span>';
                }
                
                chatUserInfo.innerHTML = `
                    <img src="${user.photoURL || 'assets/avatars/default-avatar.png'}" alt="${user.displayName}" class="chat-avatar">
                    <span class="chat-current-user">${user.displayName} ${adminBadge}</span>
                `;
            }
        }
    }

    
    function loadChatMessages() {
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        console.log('Chat: Loading messages...');
        
        
        chatMessages.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chat...</p>
            </div>
        `;
        
        
        database.ref('.info/connected').once('value')
            .then(function(snapshot) {
                const connected = snapshot.val();
                if (!connected) {
                    console.error('Chat: Firebase not connected');
                    chatMessages.innerHTML = `
                        <div class="chat-empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Unable to connect to chat. Please check your internet connection and try again.</p>
                        </div>
                    `;
                    return;
                }
                
                console.log('Chat: Database connection verified, fetching messages');
                
                
                const chatRef = database.ref('chat');
                
                
                const connectionTimeout = setTimeout(function() {
                    chatMessages.innerHTML = `
                        <div class="chat-empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Connection timeout. Please check your internet connection and try again.</p>
                        </div>
                    `;
                }, 10000); 
                
                
                chatRef.limitToLast(50).on('value', function(snapshot) {
                    
                    clearTimeout(connectionTimeout);
                    
                    
                    chatMessages.innerHTML = '';
                    
                    const messages = snapshot.val();
                    console.log('Chat: Messages loaded', messages ? Object.keys(messages).length : 0);
                    
                    if (messages) {
                        
                        Object.keys(messages).forEach(function(key) {
                            const messageEl = createMessageElement(messages[key]);
                            chatMessages.appendChild(messageEl);
                        });
                        
                        
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    } else {
                        
                        displayChatEmptyState('No messages yet. Be the first to say hello!');
                    }
                }, function(error) {
                    
                    clearTimeout(connectionTimeout);
                    
                    console.error('Error loading chat messages:', error);
                    chatMessages.innerHTML = `
                        <div class="chat-empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error loading chat messages: ${error.message}. Please try again later.</p>
                        </div>
                    `;
                });
            })
            .catch(function(error) {
                console.error('Chat: Error checking connection status', error);
                chatMessages.innerHTML = `
                    <div class="chat-empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Connection error: ${error.message}. Please try again later.</p>
                    </div>
                `;
            });
    }

    
    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-message-user';
        
        
        const avatar = document.createElement('img');
        avatar.className = 'chat-avatar';
        avatar.src = message.userPhoto || 'assets/avatars/default-avatar.png';
        avatar.alt = message.userName || 'User';
        userDiv.appendChild(avatar);
        
        
        const username = document.createElement('span');
        username.className = 'chat-username';
        
        
        if (message.isAdmin && message.isSuperAdmin) {
            username.classList.add('super-admin-user');
            username.dataset.role = 'Super Admin';
        } else if (message.isAdmin) {
            username.classList.add('admin-user');
            username.dataset.role = 'Admin';
        }
        
        username.textContent = message.userName || 'Anonymous';
        userDiv.appendChild(username);
        
        
        messageDiv.appendChild(userDiv);
        
        
        const content = document.createElement('div');
        content.className = 'chat-message-content';
        content.textContent = message.text;
        messageDiv.appendChild(content);
        
        
        const time = document.createElement('div');
        time.className = 'chat-message-time';
        
        
        const date = new Date(message.timestamp);
        const formattedTime = date.toLocaleString();
        time.textContent = formattedTime;
        
        messageDiv.appendChild(time);
        
        return messageDiv;
    }

    
    function displayChatEmptyState(message) {
        chatMessages.innerHTML = `
            <div class="chat-empty-state">
                <i class="fas fa-comments"></i>
                <p>${message}</p>
            </div>
        `;
    }

    
    function handleChatLogin() {
        
        if (window.authState && typeof window.authState.showLogin === 'function') {
            window.authState.showLogin();
        } else {
            console.error('Auth module not available');
            alert('Authentication service is not available. Please try again later.');
        }
    }

    
    function showChatForm(user) {
        if (!chatForm || !chatUserInfo) return;
        
        
        chatForm.classList.remove('hidden');
        
        
        if (chatAuthRequired) {
            chatAuthRequired.classList.add('hidden');
        }
        
        
        chatUserInfo.innerHTML = `
            <img src="${user.photoURL || 'assets/avatars/default-avatar.png'}" alt="${user.displayName}" class="chat-avatar">
            <span class="chat-current-user">${user.displayName}</span>
        `;
    }

    
    function handleChatSubmit(event) {
        event.preventDefault();
        
        if (!chatInput) return;
        
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        
        
        chatInput.value = '';
        
        
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('User is not authenticated');
            return;
        }
        
        
        const message = {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userEmail: user.email,
            userPhoto: user.photoURL || null,
            text: messageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            isAdmin: isChatAdmin,
            isSuperAdmin: isChatSuperAdmin
        };
        
        
        database.ref('chat').push(message)
            .then(function() {
                console.log('Message sent successfully');
                
            })
            .catch(function(error) {
                console.error('Error sending message:', error);
                alert('Failed to send message: ' + error.message);
            });
    }
})(); 
