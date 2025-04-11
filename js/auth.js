/**
 * Authentication module for KKNotes
 * Handles central site-wide authentication functionality using Firebase.
 */

// --- Constants ---
const SUPER_ADMIN_EMAIL = 'christopherjoshy4@gmail.com'; // Ensure this is correct

// --- Global Auth State ---
let authCurrentUser = null;
let isAdmin = false;
let isSuperAdmin = false;

// Expose auth state and actions globally (initialize methods later)
window.authState = {
    getCurrentUser: () => authCurrentUser,
    isAdmin: () => isAdmin,
    isSuperAdmin: () => isSuperAdmin,
    showLogin: () => {
        // This will be replaced by the actual function once DOM is ready
        console.warn('Attempted to call showLogin before DOM ready.');
    },
    hideLogin: () => {
        // This will be replaced by the actual function once DOM is ready
        console.warn('Attempted to call hideLogin before DOM ready.');
    }
};

// --- DOM Ready Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Initializing KKNotes Auth...');

    // --- DOM Element References ---
    const authOverlay = document.getElementById('auth-overlay');
    const siteAuthBtn = document.getElementById('site-auth-btn');
    const authMessage = document.getElementById('auth-message');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.getElementById('user-profile');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const chatAuthRequired = document.getElementById('chat-auth-required');
    const chatForm = document.getElementById('chat-form');

    // --- Check if essential elements exist ---
    if (!authOverlay || !siteAuthBtn || !loginBtn || !logoutBtn || !userProfile || !authMessage) {
        console.error('Auth Error: One or more critical UI elements are missing. Check HTML IDs.');
        // Optionally display an error to the user or halt further script execution
        // For example: document.body.innerHTML = 'Critical Error: Authentication UI is broken.';
        return; // Stop initialization if critical elements are missing
    }

    // --- Core Authentication Logic ---

    /**
     * Shows the authentication overlay/modal.
     */
    function showAuthOverlay() {
        console.log('Showing auth overlay.');
        if (authOverlay) {
            // Reset button state
            if (siteAuthBtn) {
                siteAuthBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                siteAuthBtn.disabled = false;
            }
            // Clear previous messages
            updateAuthMessage('', 'info', true); // Hide message initially

            // Show overlay
            authOverlay.style.display = 'flex'; // Ensure it's ready to transition
            // Use a tiny timeout to allow display change to render before adding class for transition
            setTimeout(() => {
                authOverlay.classList.add('active');
                document.body.classList.add('no-scroll');
                console.log('Auth overlay should be active.');
            }, 10); // Small delay (10ms)
        } else {
            console.error('Auth overlay element not found when trying to show!');
        }
    }

    /**
     * Hides the authentication overlay/modal.
     */
    function hideAuthOverlay() {
        console.log('Hiding auth overlay.');
        if (authOverlay) {
            authOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
            // Optional: Use transitionend event to set display: none after fade out
            // authOverlay.addEventListener('transitionend', () => {
            //     if (!authOverlay.classList.contains('active')) {
            //        authOverlay.style.display = 'none';
            //     }
            // }, { once: true });
            console.log('Auth overlay should be hidden.');
        } else {
            console.error('Auth overlay element not found when trying to hide!');
        }
    }

    /**
     * Updates the message area within the auth overlay.
     * @param {string} message - Message to display.
     * @param {string} type - 'success', 'error', 'info', 'warning'.
     * @param {boolean} [hide=false] - If true, hides the message area.
     */
    function updateAuthMessage(message, type = 'info', hide = false) {
        if (!authMessage) return;

        authMessage.textContent = message;
        // Reset classes, then add the correct type
        authMessage.className = 'form-message'; // Base class
        if (!hide) {
            authMessage.classList.add(type);
            authMessage.classList.remove('hidden');
        } else {
            authMessage.classList.add('hidden');
        }
    }

    /**
     * Updates the main site UI based on authentication state.
     * @param {boolean} isAuthenticated - Whether the user is logged in.
     */
    function updateAuthUI(isAuthenticated) {
        console.log(`Updating UI for authenticated state: ${isAuthenticated}`);
        if (isAuthenticated) {
            loginBtn?.classList.add('hidden');
            userProfile?.classList.remove('hidden');
            chatForm?.classList.add('hidden'); // Initially hide, as we'll check if it actually exists
            chatAuthRequired?.classList.add('hidden'); // Initially hide auth required message

            // Restore chat UI if it exists
            if (document.getElementById('chat-form')) {
                document.getElementById('chat-form').classList.remove('hidden');
            }
            
            // Make sure signin overlay is hidden
            hideAuthOverlay();
            
            // Reset auth button state
            if (siteAuthBtn) {
                siteAuthBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                siteAuthBtn.disabled = false;
            }
            
            // Update other parts of the UI that depend on authentication
            document.querySelectorAll('[data-requires-auth="true"]').forEach(el => {
                el.classList.remove('hidden');
            });
            
            document.querySelectorAll('[data-requires-auth="false"]').forEach(el => {
                el.classList.add('hidden');
            });
        } else {
            loginBtn?.classList.remove('hidden');
            userProfile?.classList.add('hidden');
            
            // Update chat UI if it exists
            if (document.getElementById('chat-form')) {
                document.getElementById('chat-form').classList.add('hidden');
            }
            if (document.getElementById('chat-auth-required')) {
                document.getElementById('chat-auth-required').classList.remove('hidden');
            }
            
            // Clear user-specific info from UI
            if (userName) userName.textContent = '';
            if (userAvatar) userAvatar.src = 'assets/avatars/default-avatar.png'; // Reset avatar
            
            // Remove admin badge if present
            const existingBadge = userName?.querySelector('.admin-badge');
            if (existingBadge) existingBadge.remove();
            
            // Update other parts of the UI that depend on authentication
            document.querySelectorAll('[data-requires-auth="true"]').forEach(el => {
                el.classList.add('hidden');
            });
            
            document.querySelectorAll('[data-requires-auth="false"]').forEach(el => {
                el.classList.remove('hidden');
            });
        }
    }

    /**
     * Sets user information in the header/profile display.
     * @param {firebase.User} user - The Firebase user object.
     */
    function setUserInfo(user) {
        if (!user) return;
        console.log('Setting user info:', user.displayName);
        if (userName) {
            userName.textContent = user.displayName || 'User';
        }
        if (userAvatar) {
            userAvatar.src = user.photoURL || 'assets/avatars/default-avatar.png'; // Provide a default
            userAvatar.alt = user.displayName || 'User Avatar';
        }
    }

     /**
     * Updates UI elements specific to admin/super-admin roles.
     */
    function updateAdminUI() {
        if (!isAdmin) {
             // Ensure badge is removed if user is no longer admin (e.g., role change)
            const existingBadge = userName?.querySelector('.admin-badge');
             if (existingBadge) existingBadge.remove();
            return;
        }

        // Add admin badge to user profile name
        if (userName) {
            let badge = userName.querySelector('.admin-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'admin-badge';
                userName.appendChild(badge); // Append only once
            }
            // Update text and class based on superAdmin status
            badge.textContent = isSuperAdmin ? 'Super Admin' : 'Admin';
            badge.classList.toggle('super-admin', isSuperAdmin);
            console.log(`Admin badge updated: ${badge.textContent}`);
        }

        // Show admin link for both regular admins and super admins
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) {
            adminLink.classList.remove('hidden');
        }
    }


    /**
     * Checks Firebase Realtime Database for admin status.
     * @param {firebase.User} user - The Firebase user object.
     */
    function checkAdminStatus(user) {
        if (!user || !user.email) {
            isAdmin = false;
            isSuperAdmin = false;
            updateAdminUI();
            return;
        }

        // Reset status before checks
        isAdmin = false;
        isSuperAdmin = false;

        // Check #1: Super Admin Email (Hardcoded)
        if (user.email === SUPER_ADMIN_EMAIL) {
            console.log('Auth: User is Super Admin (hardcoded check).');
            isAdmin = true;
            isSuperAdmin = true;
            updateAdminUI();
            // Optionally save this super admin to the DB if they don't exist there
            // createUserRecord(user, true); // Pass a flag if needed
            return; // No need for DB check if super admin email matches
        }

        // Check #2: Database 'admins' node (Ensure 'database' is initialized elsewhere and available)
        if (typeof database === 'undefined' || !database.ref) {
            console.warn("Firebase Realtime Database ('database') is not defined. Cannot check DB for admin status.");
             updateAdminUI(); // Update UI with non-admin status
            return;
        }

        database.ref('admins').orderByChild('email').equalTo(user.email).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    // Should only be one entry due to query, but loop just in case
                    snapshot.forEach(adminSnap => {
                        const adminData = adminSnap.val();
                        if(adminData.email === user.email) { // Double check email match
                            console.log('Auth: User is Admin (database check).');
                            isAdmin = true;
                            if (adminData.superAdmin === true) { // Explicit check for boolean true
                                console.log('Auth: User is Super Admin (database check).');
                                isSuperAdmin = true;
                            }
                        }
                    });
                } else {
                    console.log('Auth: User is not an admin (database check).');
                    // isAdmin and isSuperAdmin are already false
                }
                updateAdminUI(); // Update UI after DB check
            })
            .catch(error => {
                console.error('Error checking admin status in database:', error);
                isAdmin = false; // Reset on error
                isSuperAdmin = false;
                updateAdminUI(); // Update UI with non-admin status
            });
    }


    /**
     * Creates or updates a user record in the Firebase Realtime Database.
     * @param {firebase.User} user - The Firebase user object.
     */
    function createUserRecord(user) {
        if (!user || !user.uid) return;
         if (typeof database === 'undefined' || !database.ref) {
            console.error("Firebase Realtime Database ('database') is not defined. Cannot create/update user record.");
            return;
        }

        const userRef = database.ref(`users/${user.uid}`);
        const userData = {
            displayName: user.displayName || 'Anonymous User',
            email: user.email,
            photoURL: user.photoURL || null, // Store null if no photo
            lastLogin: firebase.database.ServerValue.TIMESTAMP // Use server time
        };

        userRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                // User exists, update lastLogin and potentially other volatile info
                console.log('Updating existing user record:', user.uid);
                userRef.update({
                    lastLogin: firebase.database.ServerValue.TIMESTAMP,
                    // Optional: Update display name/photo if they might change in Google account
                    // displayName: userData.displayName,
                    // photoURL: userData.photoURL
                 });
            } else {
                // New user, set initial data including createdAt and default role
                console.log('Creating new user record:', user.uid);
                userData.createdAt = firebase.database.ServerValue.TIMESTAMP;
                userData.role = 'student'; // Set default role for new users
                 // If SUPER_ADMIN_EMAIL logs in for first time, grant superAdmin in DB too?
                 if(user.email === SUPER_ADMIN_EMAIL) {
                    userData.role = 'admin'; // Or specific super-admin role
                    // userData.superAdmin = true; // If you store this flag under users/* as well
                 }
                userRef.set(userData);
            }
        }).catch(error => {
            console.error('Error creating/updating user record:', error);
        });
    }

    /**
     * Handles the Google Sign-In process via Firebase Auth popup.
     */
    
    // Track if authentication is already in progress to prevent multiple attempts
    let authInProgress = false;
    
    function handleGoogleAuth() {
        // Prevent multiple authentication attempts
        if (authInProgress) {
            console.log('Authentication already in progress, ignoring duplicate request');
            return;
        }
        
        console.log('Starting Google authentication...');
        authInProgress = true;
        
        if (!firebase || !firebase.auth) {
             console.error('Firebase Auth is not initialized!');
             updateAuthMessage('Authentication service is unavailable.', 'error');
             authInProgress = false;
             return;
         }

        // Update button state
        siteAuthBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        siteAuthBtn.disabled = true;
        updateAuthMessage('', 'info', true); // Clear previous messages

        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Use popup method as requested
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                console.log('Auth: Google sign-in successful for:', user.email);
                authInProgress = false;

                // Create/update user record in DB *after* successful login
                createUserRecord(user);

                // Force page refresh to ensure UI is updated properly
                console.log('Refreshing page to update UI state...');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            })
            .catch((error) => {
                console.error('Auth: Google sign-in error:', error.code, error.message);
                authInProgress = false;

                // Reset button
                siteAuthBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                siteAuthBtn.disabled = false;

                // Show specific error messages
                let errorMessage = 'Authentication failed. Please try again.';
                if (error.code === 'auth/popup-closed-by-user') {
                    errorMessage = 'Sign-in cancelled.';
                } else if (error.code === 'auth/cancelled-popup-request') {
                    errorMessage = 'Sign-in cancelled. Only one pop-up allowed at a time.';
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    errorMessage = 'An account already exists with this email address using a different sign-in method.';
                }
                updateAuthMessage(errorMessage, 'error');
            });
    }

    /**
     * Handles user sign-out.
     */
    function handleLogout(event) {
        event.preventDefault(); // Prevent default link behavior if logoutBtn is an <a>
        console.log('Attempting to sign out...');
         if (!firebase || !firebase.auth) {
             console.error('Firebase Auth is not initialized! Cannot sign out.');
             alert('Error: Cannot sign out at the moment.');
             return;
         }
        firebase.auth().signOut()
            .then(() => {
                console.log('User signed out successfully.');
                // Auth state change will be handled by onAuthStateChanged listener
                // which will call updateAuthUI(false)
                // No need to manually update UI here.
                // Optionally redirect to homepage or login page
                // window.location.href = '/';
            })
            .catch(error => {
                console.error('Error signing out:', error);
                alert(`Error signing out: ${error.message}`); // Inform user
            });
    }

    // --- Attach Event Listeners ---

    // Login Button (opens the overlay)
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Login button clicked.');
        showAuthOverlay();
    });

    // Google Sign-In Button (inside the overlay)
    siteAuthBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default button behavior
        console.log('Google Auth button clicked.');
        handleGoogleAuth();
    });

    // Logout Button
    logoutBtn.addEventListener('click', handleLogout);

    // Close overlay when clicking outside the content area
    authOverlay.addEventListener('click', function(event) {
        // Check if the click target is the overlay itself (the background)
        if (event.target === authOverlay) {
            console.log('Clicked outside auth content.');
            hideAuthOverlay();
        }
    });

    // --- Update Global Auth State Methods ---
    // Now that functions are defined, point window.authState correctly
    window.authState.showLogin = showAuthOverlay;
    window.authState.hideLogin = hideAuthOverlay;

    // --- Handle redirect result when browser returns from Google auth redirect ---
    if (firebase && firebase.auth) {
        // Check if we're on an auth handler page
        if (window.location.href.includes('/__/auth/handler')) {
            console.log('Detected auth handler page, will redirect to main page');
            // If we're stuck on the auth handler page, redirect back to the main site
            setTimeout(() => {
                window.location.href = window.location.origin;
            }, 1000);
            return; // Stop initialization on auth handler page
        }
        
        // Check if returning from a redirect sign in
        firebase.auth().getRedirectResult().then(result => {
            if (result.user) {
                console.log('Redirect sign-in successful');
                authInProgress = false;
                
                // Create/update user record in DB
                createUserRecord(result.user);
                
                // Handle redirects
                const authReturnUrl = sessionStorage.getItem('authReturnUrl');
                if (authReturnUrl) {
                    sessionStorage.removeItem('authReturnUrl');
                    window.location.href = authReturnUrl;
                }
            }
        }).catch(error => {
            console.error('Redirect sign-in error:', error);
            authInProgress = false;
            
            // Only show error message if we were expecting a result from redirect
            if (sessionStorage.getItem('authReturnUrl')) {
                updateAuthMessage('Authentication failed: ' + error.message, 'error');
                sessionStorage.removeItem('authReturnUrl');
                
                // Reset button state
                siteAuthBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                siteAuthBtn.disabled = false;
            }
        });
    }

    // --- Firebase Auth State Listener ---
    // This is the SINGLE listener that reacts to login/logout events.
     if (firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            console.log('Auth state changed. User:', user ? user.email : 'None');
            if (user) {
                // User is signed IN
                authCurrentUser = user;
                setUserInfo(user); // Update header display
                checkAdminStatus(user); // Check roles (this will call updateAdminUI internally)
                updateAuthUI(true); // Update general site UI for logged-in state
                
                // Ensure the auth overlay is hidden if it's visible
                if (authOverlay && authOverlay.classList.contains('active')) {
                    console.log('User is signed in, hiding auth overlay if visible');
                    setTimeout(() => hideAuthOverlay(), 100);
                }

                // Redirect check (might be redundant if handled in handleGoogleAuth, but good fallback)
                const redirectTo = sessionStorage.getItem('redirectAfterLogin');
                if (redirectTo) {
                    console.log('Redirecting (onAuthStateChanged) to:', redirectTo);
                    sessionStorage.removeItem('redirectAfterLogin');
                     // Add a minimal delay to ensure all auth-related UI updates have settled
                    setTimeout(() => window.location.href = redirectTo, 100);
                }

            } else {
                // User is signed OUT
                authCurrentUser = null;
                isAdmin = false;
                isSuperAdmin = false;
                updateAuthUI(false); // Update UI for logged-out state
                // No need to call setUserInfo(null) as updateAuthUI handles hiding/resetting
                 updateAdminUI(); // Ensure admin UI elements are removed/reset
            }
        });
     } else {
         console.error("Firebase Auth object not found! Authentication will not work.");
         // Optionally display a persistent error message to the user on the page
         updateAuthUI(false); // Ensure UI is in logged-out state
         // Display error in auth message area if possible
         updateAuthMessage("Authentication service failed to load.", "error");
         // Make login button indicate an error?
         if(loginBtn) {
             loginBtn.textContent = "Login Unavailable";
             loginBtn.disabled = true;
         }
     }

    console.log('KKNotes Auth Initialized.');

}); // End DOMContentLoaded