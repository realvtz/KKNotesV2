/**
 * Notes module for KKNotes
 * Handles all note listing and display functionality
 */

// DOM Elements
const semesterTabs = document.querySelectorAll('.notes-section .sem-tab');
const notesContainer = document.getElementById('notes-container');

// Current active semester and subject
let currentSemester = 's1'; // Default to S1
let currentSubject = null; // No subject selected by default
let refreshInterval; // Add variable for refresh interval

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeNotes);
semesterTabs.forEach(tab => tab.addEventListener('click', handleSemesterChange));

/**
 * Initialize notes functionality
 */
function initializeNotes() {
    // Get semester tabs
    const semesterTabs = document.querySelectorAll('.notes-section .sem-tab');
    
    // Add click event to each tab
    semesterTabs.forEach(tab => {
        tab.addEventListener('click', handleSemesterChange);
    });
    
    // Load initial semester notes
    loadNotes(currentSemester);
}

/**
 * Load notes for a specific semester
 * @param {string} semester - The semester code (s1, s2, etc.)
 * @param {string} subject - Optional subject key to filter notes by
 * @param {boolean} showLoader - Whether to show the loading spinner (default: false)
 */
function loadNotes(semester, subject = null, showLoader = false) {
    // Reset current subject if loading a different semester
    if (currentSubject !== subject) {
        currentSubject = subject;
    }
    
    // Clear any existing refresh interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set a timeout to handle potential long loading times and fallback
    const timeoutId = setTimeout(() => {
        console.warn('Firebase request taking longer than expected, showing empty state as fallback');
        // If container still has old content, show empty state instead
        displayEmptyState('Could not load content. Please try again later.');
    }, 8000);
    
    try {
        // Check if we should load subjects or notes
        if (!subject) {
            // Load subjects for this semester from Firebase
            database.ref(`subjects/${semester}`).once('value')
                .then(snapshot => {
                    clearTimeout(timeoutId);
                    const subjects = snapshot.val();
                    if (subjects) {
                        console.log(`Successfully loaded subjects for ${semester}`);
                        displaySubjects(subjects, semester);
                    } else {
                        console.log(`No subjects found for ${semester}`);
                        displayEmptyState('No subjects found for this semester.');
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('Error loading subjects:', error);
                    displayError();
                    
                    // Try to recover by using the error handling function from main.js
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load subjects. Please try again later.');
                    }
                });
            
            // Set up refresh interval (30 seconds)
            refreshInterval = setInterval(() => {
                console.log('Refreshing subjects data...');
                loadNotes(semester, subject, false); // Don't show loading spinner on refresh
            }, 30000);
        } else {
            // Load notes for selected subject from Firebase
            database.ref(`notes/${semester}/${subject}`).once('value')
                .then(snapshot => {
                    clearTimeout(timeoutId);
                    const notes = snapshot.val();
                    if (notes) {
                        console.log(`Successfully loaded notes for ${semester}/${subject}`);
                        // Process each note to ensure URLs are formatted correctly
                        Object.keys(notes).forEach(key => {
                            // Make sure URL is properly formatted
                            let url = notes[key].url || notes[key].link;
                            if (url) {
                                // Ensure URL is properly formatted for Google Drive links
                                if (url.includes('drive.google.com')) {
                                    if (url.includes('localhost') || url.includes('undefined')) {
                                        // Fix incorrectly formatted local URLs
                                        const match = url.match(/drive\.google\.com.*/);
                                        if (match) {
                                            url = 'https://' + match[0];
                                        }
                                    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                        // Add https:// prefix if missing
                                        url = 'https://' + url.replace(/^\/\//, '');
                                    }
                                    
                                    // Save back both url and link properties to ensure consistency
                                    notes[key].url = url;
                                    notes[key].link = url;
                                }
                            }
                        });
                        displayNotes(notes, semester, subject);
                    } else {
                        console.log(`No notes found for ${semester}/${subject}`);
                        displayEmptyState(`No notes found for this subject.`);
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('Error loading notes:', error);
                    displayError();
                    
                    // Try to recover by using the error handling function from main.js
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load notes. Please try again later.');
                    }
                });
            
            // Set up refresh interval (30 seconds)
            refreshInterval = setInterval(() => {
                console.log('Refreshing notes data...');
                loadNotes(semester, subject, false); // Don't show loading spinner on refresh
            }, 30000);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Unexpected error in loadNotes:', error);
        displayError();
    }
}

/**
 * Display subjects for a semester
 * @param {Array} subjects - The subjects array from Firebase
 * @param {string} semester - The current semester code
 */
function displaySubjects(subjects, semester) {
    if (!notesContainer) return;
    
    // Create container for subjects
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'subjects-container';
    
    // Add semester title
    const semTitle = document.createElement('h3');
    semTitle.className = 'semester-title';
    semTitle.textContent = `Semester ${semester.substring(1)} Subjects`;
    subjectsContainer.appendChild(semTitle);
    
    // Create subject list
    const subjectsList = document.createElement('div');
    subjectsList.className = 'subjects-list';
    
    // Create back button for mobile (only shown when viewing notes)
    const backButton = document.createElement('button');
    backButton.className = 'back-button hidden';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Subjects';
    backButton.addEventListener('click', () => {
        currentSubject = null;
        loadNotes(currentSemester);
    });
    subjectsContainer.appendChild(backButton);
    
    // Add each subject as a button
    subjects.forEach(subject => {
        const subjectBtn = document.createElement('button');
        subjectBtn.className = 'subject-btn';
        subjectBtn.dataset.subject = subject.key || subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
        subjectBtn.dataset.id = subject.id || subject.key;
        subjectBtn.textContent = subject.name;
        
        // Add click event to load notes for this subject
        subjectBtn.addEventListener('click', handleSubjectClick);
        
        subjectsList.appendChild(subjectBtn);
    });
    
    subjectsContainer.appendChild(subjectsList);
    
    // Clear container and add subjects
    notesContainer.innerHTML = '';
    notesContainer.appendChild(subjectsContainer);
    
    // Apply animation for smooth transition
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(notesContainer);
    }
}

/**
 * Create a note card element
 * @param {Object} note - The note object
 * @returns {HTMLElement} - The note card element
 */
function createNoteCard(note) {
    const thumbnailUrl = note.thumbnailUrl || 'assets/pdf-icon.png';
    
    const card = document.createElement('div');
    card.className = 'note-card';
    // Force styles with !important to override any conflicting CSS
    card.style.cssText = `
        min-height: 450px !important;
        width: 100% !important;
        max-width: 400px !important;
        margin: 0 auto !important;
        border-radius: 20px !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        background-color: white !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
        border: 1px solid rgba(99, 102, 241, 0.15) !important;
        position: relative !important;
    `;
    
    // Ensure URL is properly formatted for Google Drive links
    let driveUrl = note.url || note.link;
    // If URL isn't set or is invalid, default to a safe value
    if (!driveUrl) {
        console.warn('Note is missing URL:', note);
        driveUrl = '#'; // Fallback to prevent broken links
    } else if (driveUrl.includes('localhost') || driveUrl.includes('undefined')) {
        // Fix incorrectly formatted local URLs that should be Drive links
        console.warn('Fixing malformed URL:', driveUrl);
        if (driveUrl.includes('drive.google.com')) {
            // Extract the Google Drive portion from the malformed URL
            const match = driveUrl.match(/drive\.google\.com.*/);
            if (match) {
                driveUrl = 'https://' + match[0];
            }
        }
    } else if (!driveUrl.startsWith('http://') && !driveUrl.startsWith('https://')) {
        // Add https:// prefix if missing
        driveUrl = 'https://' + driveUrl.replace(/^\/\//, '');
    }
    
    // Create a complete URL object to validate
    try {
        new URL(driveUrl);
    } catch (e) {
        console.error('Invalid URL after formatting:', driveUrl);
        driveUrl = '#'; // Fallback to prevent broken links
    }
    
    card.innerHTML = `
        <div class="note-preview" style="height: 200px !important; border-radius: 20px 20px 0 0 !important; overflow: hidden !important; position: relative !important;">
            <img src="${thumbnailUrl}" alt="${note.title}" class="note-thumbnail" style="width: 100% !important; height: 100% !important; object-fit: cover !important;" onerror="this.src='assets/pdf-icon.png'">
        </div>
        <div class="note-info" style="padding: 28px !important; flex: 1 !important; display: flex !important; flex-direction: column !important;">
            <h3 class="note-title" style="font-size: 22px !important; margin: 0 0 16px 0 !important; max-height: 62px !important; line-height: 1.4 !important; font-weight: 600 !important; color: #1f2937 !important;">${note.title}</h3>
            <p class="note-description" style="font-size: 16px !important; margin-bottom: 24px !important; line-height: 1.5 !important; flex: 1 !important; color: #4b5563 !important;">${note.description || 'No description available.'}</p>
            <div class="note-actions" style="display: flex !important; gap: 16px !important; margin-top: auto !important;">
                <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="drive-link" style="width: 100% !important; padding: 12px 18px !important; font-weight: 600 !important; font-size: 16px !important; border-radius: 50px !important; background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; text-align: center !important; display: flex !important; justify-content: center !important; align-items: center !important; text-decoration: none !important;">
                    <i class="fas fa-external-link-alt" style="margin-right: 8px !important;"></i> Open in Google Drive
                </a>
            </div>
        </div>
    `;
    
    // Ensure the link properly opens in a new tab with correct URL
    const driveLink = card.querySelector('.drive-link');
    if (driveLink) {
        driveLink.addEventListener('click', function(e) {
            if (driveUrl === '#') {
                e.preventDefault();
                console.error('Unable to open invalid drive link');
                return;
            }
            
            // Double check we have a valid Google Drive URL before opening
            if (!driveUrl.includes('drive.google.com')) {
                console.warn('Non-Google Drive URL detected:', driveUrl);
            }
        });
    }
    
    return card;
}

/**
 * Display notes in the container
 * @param {Object} notes - The notes object from Firebase
 * @param {string} semester - The current semester code
 * @param {string} subject - The current subject key
 */
function displayNotes(notes, semester, subject) {
    if (!notesContainer) return;
    
    if (!notes || Object.keys(notes).length === 0) {
        displayEmptyState(`No notes found for this subject.`);
        return;
    }
    
    // Get the subject name from the active button
    const activeSubjectBtn = document.querySelector('.subject-btn.active');
    const subjectName = activeSubjectBtn ? activeSubjectBtn.textContent : 'Subject';
    
    // Create notes list container
    const notesList = document.createElement('div');
    notesList.className = 'notes-list';
    
    // Add subject title
    const subjectTitle = document.createElement('h3');
    subjectTitle.className = 'subject-title';
    subjectTitle.textContent = subjectName;
    notesList.appendChild(subjectTitle);
    
    // Create grid container for the cards
    const notesGrid = document.createElement('div');
    notesGrid.className = 'notes-grid';
    
    // Add each note as a card
    Object.keys(notes).forEach(key => {
        const note = notes[key];
        const noteCard = createNoteCard(note);
        notesGrid.appendChild(noteCard);
    });
    
    // Add grid to list
    notesList.appendChild(notesGrid);
    
    // Clear notes area (keeping subject list)
    const existingNotesList = document.querySelector('.notes-list');
    if (existingNotesList) {
        existingNotesList.remove();
    }
    
    // Add the notes list
    notesContainer.appendChild(notesList);
    
    // Apply animation for smooth transition
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(notesContainer);
    }
}

/**
 * Display empty state with custom message
 * @param {string} message - Custom message to display
 */
function displayEmptyState(message = 'There are no notes available for this semester yet.') {
    if (!notesContainer) return;
    
    // If we're viewing a subject, only update the notes area
    const existingSubjectsContainer = document.querySelector('.subjects-container');
    const existingNotesList = document.querySelector('.notes-list');
    
    if (currentSubject && existingSubjectsContainer && existingNotesList) {
        existingNotesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>${message}</p>
            </div>
        `;
    } else {
        // Otherwise, update the entire container
        notesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Display error state when notes can't be loaded
 */
function displayError() {
    if (!notesContainer) return;
    
    notesContainer.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load notes. Please try again later.</p>
        </div>
    `;
}

/**
 * Handle semester tab change
 * @param {Event} event - The click event
 */
function handleSemesterChange(event) {
    const semester = event.target.dataset.sem;
    
    // Update active tab
    semesterTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update current semester and load notes
    currentSemester = semester;
    loadNotes(semester);
}

/**
 * Handle subject button click
 * @param {Event} event - The click event
 */
function handleSubjectClick(event) {
    const subject = event.target.dataset.subject;
    const subjectName = event.target.textContent || 'Subject';
    
    // Update active subject button
    const subjectBtns = document.querySelectorAll('.subject-btn');
    subjectBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show back button on mobile
    const backButton = document.querySelector('.back-button');
    if (backButton) backButton.classList.remove('hidden');
    
    // Load notes for this subject
    loadNotes(currentSemester, subject);
} 