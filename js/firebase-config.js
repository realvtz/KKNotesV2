// Firebase configuration
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: `${FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    databaseURL: `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    appId: FIREBASE_APP_ID
};

// Flag to track initialization status
let firebaseInitialized = false;
let databaseConnectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Initialize Firebase
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
    firebase.app(); // if already initialized
    console.log('Using existing Firebase app');
    firebaseInitialized = true;
}

// Get a reference to the database service
const database = firebase.database();
const auth = firebase.auth();
let currentUser = null;

// Test database connection and retry if needed
function testDatabaseConnection() {
    console.log('Testing Firebase database connection...');
    databaseConnectionAttempts++;
    
    // Clear any existing connection listeners
    firebase.database().ref('.info/connected').off();
    
    // Add connection listener
    firebase.database().ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log('✅ Successfully connected to Firebase!');
            
            // Initialize database structure once connected
            initializeDatabase();
            
            // Dispatch a custom event for components waiting on connection
            document.dispatchEvent(new CustomEvent('firebase-connected'));
        } else {
            console.log('❌ Not connected to Firebase database');
            
            // If we're disconnected and haven't exceeded retry attempts
            if (databaseConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                console.log(`Retrying connection (attempt ${databaseConnectionAttempts} of ${MAX_CONNECTION_ATTEMPTS})...`);
                // Wait and retry connection
                setTimeout(testDatabaseConnection, 3000);
            } else {
                console.error('Failed to connect to Firebase after multiple attempts.');
                document.dispatchEvent(new CustomEvent('firebase-connection-failed'));
            }
        }
    });
    
    // Set a timeout to catch cases where Firebase doesn't respond at all
    setTimeout(() => {
        firebase.database().ref('.info/connected').once('value')
            .then(snap => {
                // If we haven't connected yet and haven't exceeded retry attempts
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

// Run the connection test
if (firebaseInitialized) {
    testDatabaseConnection();
}

// Initialize with default subjects for each semester
const defaultSubjects = {
    s1: [
        { name: "Linear Algebra and Calculus", key: "linear_algebra_and_calculus" },
        { name: "Engineering Physics A", key: "engineering_physics_a" },
        { name: "Engineering Mechanics", key: "engineering_mechanics" },
        { name: "Basics of Civil & Mechanical Engineering", key: "basics_of_civil_mechanical_engineering" },
        { name: "Engineering Physics Lab", key: "engineering_physics_lab" },
        { name: "Civil & Mechanical Workshop", key: "civil_mechanical_workshop" }
    ],
    s2: [
        { name: "Vector Calculus, Differential Equations and Transforms", key: "vector_calculus_differential_equations" },
        { name: "Engineering Chemistry", key: "engineering_chemistry" },
        { name: "Engineering Graphics", key: "engineering_graphics" },
        { name: "Basics of Electrical & Electronics Engineering", key: "basics_of_electrical_electronics" },
        { name: "Engineering Chemistry Lab", key: "engineering_chemistry_lab" },
        { name: "Electrical & Electronics Workshop", key: "electrical_electronics_workshop" },
        { name: "Programming in C", key: "programming_in_c" }
    ],
    s3: [
        { name: "Discrete Mathematical Structures", key: "discrete_mathematical_structures" },
        { name: "Data Structures", key: "data_structures" },
        { name: "Logic System Design", key: "logic_system_design" },
        { name: "Object Oriented Programming using Java", key: "object_oriented_programming_java" },
        { name: "Design & Engineering / Professional Ethics", key: "design_engineering_s3" },
        { name: "Sustainable Engineering", key: "sustainable_engineering" },
        { name: "Data Structures Lab", key: "data_structures_lab" },
        { name: "Object Oriented Programming Lab (in Java)", key: "object_oriented_programming_lab" }
    ],
    s4: [
        { name: "Graph Theory", key: "graph_theory" },
        { name: "Computer Organization and Architecture", key: "computer_organization_architecture" },
        { name: "Database Management Systems", key: "database_management_systems" },
        { name: "Operating Systems", key: "operating_systems" },
        { name: "Design & Engineering / Professional Ethics", key: "design_engineering_s4" },
        { name: "Constitution of India", key: "constitution_of_india" },
        { name: "Digital Lab", key: "digital_lab" },
        { name: "Operating Systems Lab", key: "operating_systems_lab" }
    ],
    s5: [
        { name: "Formal Languages and Automata Theory", key: "formal_languages_automata" },
        { name: "Computer Networks", key: "computer_networks" },
        { name: "System Software", key: "system_software" },
        { name: "Microprocessors and Microcontrollers", key: "microprocessors_microcontrollers" },
        { name: "Management of Software Systems", key: "management_software_systems" },
        { name: "Disaster Management", key: "disaster_management" },
        { name: "System Software and Microprocessors Lab", key: "system_software_lab" },
        { name: "Database Management Systems Lab", key: "dbms_lab" }
    ],
    s6: [
        { name: "Compiler Design", key: "compiler_design" },
        { name: "Computer Graphics and Image Processing", key: "computer_graphics" },
        { name: "Algorithm Analysis and Design", key: "algorithm_analysis" },
        { name: "Program Elective I", key: "program_elective_1" },
        { name: "Industrial Economics & Foreign Trade", key: "industrial_economics" },
        { name: "Comprehensive Course Work", key: "comprehensive_course_work" },
        { name: "Networking Lab", key: "networking_lab" },
        { name: "Miniproject", key: "miniproject" }
    ],
    s7: [
        { name: "Artificial Intelligence", key: "artificial_intelligence" },
        { name: "Program Elective II", key: "program_elective_2" },
        { name: "Open Elective", key: "open_elective" },
        { name: "Industrial Safety Engineering", key: "industrial_safety" },
        { name: "Compiler Lab", key: "compiler_lab" },
        { name: "Seminar", key: "seminar" },
        { name: "Project Phase I", key: "project_phase_1" }
    ],
    s8: [
        { name: "Distributed Computing", key: "distributed_computing" },
        { name: "Program Elective III", key: "program_elective_3" },
        { name: "Program Elective IV", key: "program_elective_4" },
        { name: "Program Elective V", key: "program_elective_5" },
        { name: "Comprehensive Course Viva", key: "comprehensive_viva" },
        { name: "Project Phase II", key: "project_phase_2" }
    ]
};

/**
 * Function to initialize database with proper structure
 */
function initializeDatabase() {
    console.log('Initializing database structure...');
    
    // Check if the system configuration exists
    database.ref('config').once('value', configSnapshot => {
        if (!configSnapshot.exists()) {
            // Create initial configuration
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
            
            // Set configuration
            database.ref('config').set(initialConfig)
                .then(() => console.log('Configuration initialized'))
                .catch(error => console.error('Error initializing configuration:', error));
        }
    });
    
    // Check if admins collection exists
    database.ref('admins').once('value', adminsSnapshot => {
        if (!adminsSnapshot.exists()) {
            // Create permanent admin
            const admins = {
                'christopherjoshy4': {
                    email: "christopherjoshy4@gmail.com".toLowerCase(),
                    role: "superadmin",
                    isPermanent: true,
                    dateAdded: firebase.database.ServerValue.TIMESTAMP
                }
            };
            
            // Set admins
            database.ref('admins').set(admins)
                .then(() => console.log('Admin users initialized'))
                .catch(error => console.error('Error initializing admin users:', error));
        }
    });
    
    // Create chat collection if it doesn't exist
    database.ref('chat').once('value', chatSnapshot => {
        if (!chatSnapshot.exists()) {
            // Add a welcome message
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
            
            // Add the welcome message
            database.ref('chat').push(welcomeMessage)
                .then(() => console.log('Chat system initialized with welcome message'))
                .catch(error => console.error('Error initializing chat:', error));
        }
    });
    
    // Check if subjects collection exists
    database.ref('subjects').once('value', subjectsSnapshot => {
        if (!subjectsSnapshot.exists()) {
            // Set default subjects
            database.ref('subjects').set(defaultSubjects)
                .then(() => console.log('Default subjects initialized'))
                .catch(error => console.error('Error initializing default subjects:', error));
        } else {
            console.log('Subjects already initialized');
        }
    });
    
    // Check if notes collection exists
    database.ref('notes').once('value', notesSnapshot => {
        if (!notesSnapshot.exists()) {
            // Create empty notes structure
            const notesInitialStructure = {};
            
            // Initialize empty notes collection
            database.ref('notes').set(notesInitialStructure)
                .then(() => console.log('Notes structure initialized'))
                .catch(error => console.error('Error initializing notes structure:', error));
        } else {
            console.log('Notes already initialized');
        }
    });
    
    // Check if videos collection exists
    database.ref('videos').once('value', videosSnapshot => {
        if (!videosSnapshot.exists()) {
            // Create empty videos structure
            const videosInitialStructure = {};
            
            // Initialize empty videos collection
            database.ref('videos').set(videosInitialStructure)
                .then(() => console.log('Videos structure initialized'))
                .catch(error => console.error('Error initializing videos structure:', error));
        } else {
            console.log('Videos already initialized');
        }
    });
}

// Helper function to check if a user is an admin
function isUserAdmin(email) {
    return new Promise((resolve, reject) => {
        if (!email) {
            resolve(false);
            return;
        }
        
        // Extract the username part of the email
        const username = email.split('@')[0];
        
        // Check if user is in admins list
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

// Helper function to check if user is a super admin (permanent)
function isUserSuperAdmin(email) {
    return new Promise((resolve, reject) => {
        if (!email) {
            resolve(false);
            return;
        }
        
        // Check if user is the permanent admin
        database.ref('config/permanentAdmin').once('value')
            .then(snapshot => {
                if (snapshot.exists() && snapshot.val() === email) {
                    resolve(true);
                } else {
                    // Check if user has superadmin role
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

// Helper function to convert a subject name to a database key
function subjectToKey(subject) {
    return subject.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Helper function to convert a database key to a readable subject name
function keyToSubject(key, semester) {
    // First check if we can find the original name in the subjects list
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
                // If not found, convert key to a readable form
                resolve(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            })
            .catch(() => {
                // Fallback to basic formatting
                resolve(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            });
    });
}

// Auth state change monitoring
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        console.log('User signed in:', user.email);
        // Check admin status when user signs in
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

// Initialize database when the app loads
document.addEventListener('DOMContentLoaded', initializeDatabase);

// Export database references and initialization function
window.db = {
    notesRef: database.ref('notes'),
    videosRef: database.ref('videos'),
    adminsRef: database.ref('admins'),
    semestersRef: database.ref('semesters'),
    subjectsRef: database.ref('subjects'),
    initializeDatabase
};
