
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: `${FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    databaseURL: `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    appId: FIREBASE_APP_ID
};


let firebaseInitialized = false;
let databaseConnectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;


if (!firebase.apps.length) {
    try {
        console.log('Initializing Firebase with config:', JSON.stringify({
            apiKey: firebaseConfig.apiKey ? "API_KEY_PROVIDED" : "API_KEY_MISSING",
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
            messagingSenderId: firebaseConfig.messagingSenderId ? "MESSAGING_SENDER_ID_PROVIDED" : "MESSAGING_SENDER_ID_MISSING",
            databaseURL: firebaseConfig.databaseURL,
            appId: firebaseConfig.appId ? "APP_ID_PROVIDED" : "APP_ID_MISSING"
        }));
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
        firebaseInitialized = true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        console.error('Firebase config used:', {
            apiKey: firebaseConfig.apiKey ? "API_KEY_PROVIDED" : "API_KEY_MISSING",
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            messagingSenderId: firebaseConfig.messagingSenderId ? "MESSAGING_SENDER_ID_PROVIDED" : "MESSAGING_SENDER_ID_MISSING",
            appId: firebaseConfig.appId ? "APP_ID_PROVIDED" : "APP_ID_MISSING"
        });
        alert('Error connecting to Firebase: ' + error.message);
    }
} else {
    firebase.app(); 
    console.log('Using existing Firebase app');
    firebaseInitialized = true;
}


const database = firebase.database();
const auth = firebase.auth();
let currentUser = null;


function testDatabaseConnection() {
    console.log('Testing Firebase database connection...');
    databaseConnectionAttempts++;
    
    
    firebase.database().ref('.info/connected').off();
    
    
    firebase.database().ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log('✅ Successfully connected to Firebase!');
            
            
            initializeDatabase();
            
            
            document.dispatchEvent(new CustomEvent('firebase-connected'));
        } else {
            console.log('❌ Not connected to Firebase database');
            
            
            if (databaseConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                console.log(`Retrying connection (attempt ${databaseConnectionAttempts} of ${MAX_CONNECTION_ATTEMPTS})...`);
                
                setTimeout(testDatabaseConnection, 3000);
            } else {
                console.error('Failed to connect to Firebase after multiple attempts.');
                document.dispatchEvent(new CustomEvent('firebase-connection-failed'));
            }
        }
    });
    
    
    setTimeout(() => {
        firebase.database().ref('.info/connected').once('value')
            .then(snap => {
                
                if (!snap.val() && databaseConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                    console.log(`Connection timeout, retrying (attempt ${databaseConnectionAttempts} of ${MAX_CONNECTION_ATTEMPTS})...`);
                    testDatabaseConnection();
                }
            })
            .catch(error => {
                console.error('Error testing connection:', error);
                if (databaseConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                    console.log(`Connection error, retrying (attempt ${databaseConnectionAttempts} of ${MAX_CONNECTION_ATTEMPTS})...`);
                    setTimeout(testDatabaseConnection, 3000);
                }
            });
    }, 5000);
}


if (firebaseInitialized) {
    testDatabaseConnection();
}




function initializeDatabase() {
    console.log('Initializing database structure...');
    
    
    database.ref('config').once('value', configSnapshot => {
        if (!configSnapshot.exists()) {
            
            const initialConfig = {
                permanentAdmin: "christopherjoshy4@gmail.com",
                version: "1.0.0",
                lastUpdated: firebase.database.ServerValue.TIMESTAMP,
                features: {
                    googleAuth: true,
                    youtubeVideos: true,
                    nightMode: true
                }
            };
            
            
            database.ref('config').set(initialConfig)
                .then(() => console.log('Configuration initialized'))
                .catch(error => console.error('Error initializing configuration:', error));
        }
    });
    
    
    database.ref('admins').once('value', adminsSnapshot => {
        if (!adminsSnapshot.exists()) {
            
            const admins = {
                'christopherjoshy4': {
                    email: "christopherjoshy4@gmail.com".toLowerCase(),
                    role: "superadmin",
                    isPermanent: true,
                    dateAdded: firebase.database.ServerValue.TIMESTAMP
                }
            };
            
            
            database.ref('admins').set(admins)
                .then(() => console.log('Admin users initialized'))
                .catch(error => console.error('Error initializing admin users:', error));
        }
    });
    
    
    database.ref('chat').once('value', chatSnapshot => {
        if (!chatSnapshot.exists()) {
            
            const welcomeMessage = {
                userId: 'system',
                userName: 'KKNotes System',
                userEmail: 'system@kknotes.com',
                userPhoto: 'assets/logo.svg',
                text: 'Welcome to KKNotes Global Chat! Connect with other students, share resources, and help each other with your courses.',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                isAdmin: true,
                isSuperAdmin: true
            };
            
            
            database.ref('chat').push(welcomeMessage)
                .then(() => console.log('Chat system initialized with welcome message'))
                .catch(error => console.error('Error initializing chat:', error));
        }
    });
    
    
    database.ref('subjects').once('value', subjectsSnapshot => {
        if (!subjectsSnapshot.exists()) {
            
            console.log('Error initializing default subjects:  Contact the developer(christopherjoshy4@gmail.com)');
        } else {
            console.log('Subjects already initialized');
        }
    });
    
    
    database.ref('notes').once('value', notesSnapshot => {
        if (!notesSnapshot.exists()) {
            
            const notesInitialStructure = {};
            
            
            database.ref('notes').set(notesInitialStructure)
                .then(() => console.log('Notes structure initialized'))
                .catch(error => console.error('Error initializing notes structure:', error));
        } else {
            console.log('Notes already initialized');
        }
    });
    
    
    database.ref('videos').once('value', videosSnapshot => {
        if (!videosSnapshot.exists()) {
            
            const videosInitialStructure = {};
            
            
            database.ref('videos').set(videosInitialStructure)
                .then(() => console.log('Videos structure initialized'))
                .catch(error => console.error('Error initializing videos structure:', error));
        } else {
            console.log('Videos already initialized');
        }
    });
}


function isUserAdmin(email) {
    return new Promise((resolve, reject) => {
        if (!email) {
            resolve(false);
            return;
        }
        
        
        const username = email.split('@')[0];
        
        
        database.ref('admins').orderByChild('email').equalTo(email).once('value')
            .then(snapshot => {
                resolve(snapshot.exists());
            })
            .catch(error => {
                console.error('Error checking admin status:', error);
                reject(error);
            });
    });
}


function isUserSuperAdmin(email) {
    return new Promise((resolve, reject) => {
        if (!email) {
            resolve(false);
            return;
        }
        
        
        database.ref('config/permanentAdmin').once('value')
            .then(snapshot => {
                if (snapshot.exists() && snapshot.val() === email) {
                    resolve(true);
                } else {
                    
                    database.ref('admins').orderByChild('email').equalTo(email).once('value')
                        .then(adminSnapshot => {
                            if (adminSnapshot.exists()) {
                                let isSuperAdmin = false;
                                adminSnapshot.forEach(childSnapshot => {
                                    if (childSnapshot.val().role === 'superadmin') {
                                        isSuperAdmin = true;
                                    }
                                });
                                resolve(isSuperAdmin);
                            } else {
                                resolve(false);
                            }
                        });
                }
            })
            .catch(error => {
                console.error('Error checking super admin status:', error);
                reject(error);
            });
    });
}


function subjectToKey(subject) {
    return subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
}


function keyToSubject(key, semester) {
    
    return new Promise((resolve) => {
        database.ref(`subjects/${semester}`).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const subjects = snapshot.val();
                    for (let i = 0; i < subjects.length; i++) {
                        if (subjectToKey(subjects[i].name) === key) {
                            resolve(subjects[i].name);
                            return;
                        }
                    }
                }
                
                resolve(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            })
            .catch(() => {
                
                resolve(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            });
    });
}


auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        console.log('User signed in:', user.email);
        
        isUserAdmin(user.email).then(admin => {
            if (admin) {
                console.log('User is an admin');
                sessionStorage.setItem('isAdmin', 'true');
            } else {
                console.log('User is not an admin');
                sessionStorage.setItem('isAdmin', 'false');
            }
        });
    } else {
        console.log('User signed out');
        sessionStorage.removeItem('isAdmin');
    }
});


document.addEventListener('DOMContentLoaded', initializeDatabase);


window.db = {
    notesRef: database.ref('notes'),
    videosRef: database.ref('videos'),
    adminsRef: database.ref('admins'),
    semestersRef: database.ref('semesters'),
    subjectsRef: database.ref('subjects'),
    initializeDatabase
};

