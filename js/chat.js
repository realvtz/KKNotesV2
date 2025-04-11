// Chat functionality module
(function() {
    'use strict';
    
    // DOM Elements
    var chatMessages;
    var chatForm;
    var chatInput;
    var chatLoginBtn;
    var chatUserInfo;
    var chatLoginContainer;
    var chatAuthRequired;

    // State variables
    var isChatAdmin = false;
    var isChatSuperAdmin = false;

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, initialize immediately
        init();
    }

    /**
     * Initialize the chat module
     */
    function init() {
        console.log('Chat: Initializing module');
        // Get DOM elements
        chatMessages = document.getElementById('chat-messages');
        chatForm = document.getElementById('chat-form');
        chatInput = document.getElementById('chat-input');
        chatLoginBtn = document.getElementById('chat-login-btn');
        chatUserInfo = document.getElementById('chat-user-info');
        chatLoginContainer = document.querySelector('.chat-login');
        chatAuthRequired = document.getElementById('chat-auth-required');
        
        // Set up event listeners
        initializeEventListeners();
        
        // Listen for Firebase connection events
        document.addEventListener('firebase-connected', onFirebaseConnected);
        document.addEventListener('firebase-connection-failed', onFirebaseConnectionFailed);
        
        // Initialize auth state monitoring
        initializeChat();
    }

    /**
     * Initialize event listeners for chat functionality
     */
    function initializeEventListeners() {
        if (chatForm) {
            chatForm.addEventListener('submit', handleChatSubmit);
        }
        
        if (chatLoginBtn) {
            chatLoginBtn.addEventListener('click', handleChatLogin);
        }
    }

    /**
     * Initialize chat functionality
     */
    function initializeChat() {
        console.log('Chat: Setting up auth monitoring');
        
        // Check auth state
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                console.log('Chat: User is signed in');
                
                // Check if user is an admin
                checkChatAdminStatus(user);
                
                // Show the chat form for the authenticated user
                showChatForm(user);
                
                // Load chat messages
                loadChatMessages();
            } else {
                // User is signed out
                console.log('Chat: User is signed out');
                
                // Hide the chat form
                if (chatForm) chatForm.classList.add('hidden');
                if (chatLoginContainer) chatLoginContainer.classList.remove('hidden');
                
                // Reset admin status
                isChatAdmin = false;
                isChatSuperAdmin = false;
                
                // Still load chat messages for viewing
                loadChatMessages();
                
                // Show auth required message if it exists
                if (chatAuthRequired) chatAuthRequired.classList.remove('hidden');
            }
        });
    }
    
    /**
     * Handle Firebase connection success
     */
    function onFirebaseConnected() {
        console.log('Chat: Firebase connection established, loading messages');
        if (chatMessages) {
            loadChatMessages();
        }
    }

    /**
     * Handle Firebase connection failure
     */
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

    /**
     * Check if the current user has admin privileges for chat
     * @param {Object} user - The authenticated user object
     */
    function checkChatAdminStatus(user) {
        if (!user) return;
        
        const email = user.email;
        
        // Check if the user is the permanent admin
        if (email === 'christopherjoshy4@gmail.com') {
            console.log('Chat: User is super admin (permanent)');
            isChatAdmin = true;
            isChatSuperAdmin = true;
            updateChatAdminUI();
            return;
        }
        
        // Check admin status in the database
        database.ref('admins').once('value')
            .then(function(snapshot) {
                const admins = snapshot.val();
                if (admins) {
                    const adminKeys = Object.keys(admins);
                    for (const key of adminKeys) {
                        if (admins[key].email === email) {
                            console.log('Chat: User is admin');
                            isChatAdmin = true;
                            
                            // Check if the admin has super admin privileges
                            if (admins[key].superAdmin) {
                                console.log('Chat: User is super admin');
                                isChatSuperAdmin = true;
                            }
                            
                            // Update UI based on admin status
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

    /**
     * Update the UI elements based on admin status
     */
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

    /**
     * Load chat messages from Firebase
     */
    function loadChatMessages() {
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        console.log('Chat: Loading messages...');
        
        // Clear existing messages and show loading spinner
        chatMessages.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chat...</p>
            </div>
        `;
        
        // Verify database connection first
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
                
                // Reference to chat messages in Firebase
                const chatRef = database.ref('chat');
                
                // Set up error handling for database connection
                const connectionTimeout = setTimeout(function() {
                    chatMessages.innerHTML = `
                        <div class="chat-empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Connection timeout. Please check your internet connection and try again.</p>
                        </div>
                    `;
                }, 10000); // 10 second timeout
                
                // Listen for new messages
                chatRef.limitToLast(50).on('value', function(snapshot) {
                    // Clear timeout since we got a response
                    clearTimeout(connectionTimeout);
                    
                    // Clear loading spinner
                    chatMessages.innerHTML = '';
                    
                    const messages = snapshot.val();
                    console.log('Chat: Messages loaded', messages ? Object.keys(messages).length : 0);
                    
                    if (messages) {
                        // Display messages
                        Object.keys(messages).forEach(function(key) {
                            const messageEl = createMessageElement(messages[key]);
                            chatMessages.appendChild(messageEl);
                        });
                        
                        // Scroll to bottom
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    } else {
                        // No messages found
                        displayChatEmptyState('No messages yet. Be the first to say hello!');
                    }
                }, function(error) {
                    // Clear timeout since we got a response (even if it's an error)
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

    /**
     * Create a message element for the chat
     * @param {Object} message - The message object
     * @returns {HTMLElement} - The message element
     */
    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        // Create user info element
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-message-user';
        
        // Add user avatar
        const avatar = document.createElement('img');
        avatar.className = 'chat-avatar';
        avatar.src = message.userPhoto || 'assets/avatars/default-avatar.png';
        avatar.alt = message.userName || 'User';
        userDiv.appendChild(avatar);
        
        // Add username with potential admin badge
        const username = document.createElement('span');
        username.className = 'chat-username';
        
        // Add role-specific classes and data attributes
        if (message.isAdmin && message.isSuperAdmin) {
            username.classList.add('super-admin-user');
            username.dataset.role = 'Super Admin';
        } else if (message.isAdmin) {
            username.classList.add('admin-user');
            username.dataset.role = 'Admin';
        }
        
        username.textContent = message.userName || 'Anonymous';
        userDiv.appendChild(username);
        
        // Add message div to the main container
        messageDiv.appendChild(userDiv);
        
        // Create message content
        const content = document.createElement('div');
        content.className = 'chat-message-content';
        content.textContent = message.text;
        messageDiv.appendChild(content);
        
        // Add timestamp
        const time = document.createElement('div');
        time.className = 'chat-message-time';
        
        // Format the timestamp
        const date = new Date(message.timestamp);
        const formattedTime = date.toLocaleString();
        time.textContent = formattedTime;
        
        messageDiv.appendChild(time);
        
        return messageDiv;
    }

    /**
     * Display an empty state message in the chat
     * @param {string} message - The message to display
     */
    function displayChatEmptyState(message) {
        chatMessages.innerHTML = `
            <div class="chat-empty-state">
                <i class="fas fa-comments"></i>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Handle login for chat
     */
    function handleChatLogin() {
        // Use the auth module to handle login
        if (window.authState && typeof window.authState.showLogin === 'function') {
            window.authState.showLogin();
        } else {
            console.error('Auth module not available');
            alert('Authentication service is not available. Please try again later.');
        }
    }

    /**
     * Show the chat form for an authenticated user
     * @param {Object} user - The authenticated user
     */
    function showChatForm(user) {
        if (!chatForm || !chatUserInfo) return;
        
        // Show the form
        chatForm.classList.remove('hidden');
        
        // Hide the auth required message
        if (chatAuthRequired) {
            chatAuthRequired.classList.add('hidden');
        }
        
        // Set up user info
        chatUserInfo.innerHTML = `
            <img src="${user.photoURL || 'assets/avatars/default-avatar.png'}" alt="${user.displayName}" class="chat-avatar">
            <span class="chat-current-user">${user.displayName}</span>
        `;
    }

    /**
     * Handle chat form submission
     * @param {Event} event - The form submission event
     */
    function handleChatSubmit(event) {
        event.preventDefault();
        
        if (!chatInput) return;
        
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        
        // Clear input
        chatInput.value = '';
        
        // Get current user
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('User is not authenticated');
            return;
        }
        
        // Create message object
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
        
        // Add message to Firebase
        database.ref('chat').push(message)
            .then(function() {
                console.log('Message sent successfully');
                // No need to refresh messages manually
            })
            .catch(function(error) {
                console.error('Error sending message:', error);
                alert('Failed to send message: ' + error.message);
            });
    }
})(); 