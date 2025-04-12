const semesterTabs = document.querySelectorAll('.notes-section .sem-tab');
const notesContainer = document.getElementById('notes-container');


let currentSemester = 's1'; 
let currentSubject = null; 
let refreshInterval; 


document.addEventListener('DOMContentLoaded', initializeNotes);
semesterTabs.forEach(tab => tab.addEventListener('click', handleSemesterChange));


function initializeNotes() {
    
    const semesterTabs = document.querySelectorAll('.notes-section .sem-tab');
    
    
    semesterTabs.forEach(tab => {
        tab.addEventListener('click', handleSemesterChange);
    });
    
    
    loadNotes(currentSemester);
}


function loadNotes(semester, subject = null, showLoader = false) {
    
    if (currentSubject !== subject) {
        currentSubject = subject;
    }
    
    
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    
    const timeoutId = setTimeout(() => {
        console.warn('Firebase request taking longer than expected, showing empty state as fallback');
        
        displayEmptyState('Could not load content. Please try again later.');
    }, 8000);
    
    try {
        
        if (!subject) {
            
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
                    
                    
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load subjects. Please try again later.');
                    }
                });
            
            
            refreshInterval = setInterval(() => {
                console.log('Refreshing subjects data...');
                loadNotes(semester, subject, false); 
            }, 30000);
        } else {
            
            database.ref(`notes/${semester}/${subject}`).once('value')
                .then(snapshot => {
                    clearTimeout(timeoutId);
                    const notes = snapshot.val();
                    if (notes) {
                        console.log(`Successfully loaded notes for ${semester}/${subject}`);
                        
                        Object.keys(notes).forEach(key => {
                            
                            let url = notes[key].url || notes[key].link;
                            if (url) {
                                
                                if (url.includes('drive.google.com')) {
                                    if (url.includes('localhost') || url.includes('undefined')) {
                                        
                                        const match = url.match(/drive\.google\.com.*/);
                                        if (match) {
                                            url = 'https://' + match[0];
                                        }
                                    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                        
                                        url = 'https://' + url.replace(/^\/\\/, '');
                                    }
                                    
                                    
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
                    
                    
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load notes. Please try again later.');
                    }
                });
            
            
            refreshInterval = setInterval(() => {
                console.log('Refreshing notes data...');
                loadNotes(semester, subject, false); 
            }, 30000);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Unexpected error in loadNotes:', error);
        displayError();
    }
}


function displaySubjects(subjects, semester) {
    if (!notesContainer) return;
    
    
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'subjects-container';
    
    
    const semTitle = document.createElement('h3');
    semTitle.className = 'semester-title';
    semTitle.textContent = `Semester ${semester.substring(1)} Subjects`;
    subjectsContainer.appendChild(semTitle);
    
    
    const subjectsList = document.createElement('div');
    subjectsList.className = 'subjects-list';
    
    
    const backButton = document.createElement('button');
    backButton.className = 'back-button hidden';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Subjects';
    backButton.addEventListener('click', () => {
        currentSubject = null;
        loadNotes(currentSemester);
    });
    subjectsContainer.appendChild(backButton);
    
    
    subjects.forEach(subject => {
        const subjectBtn = document.createElement('button');
        subjectBtn.className = 'subject-btn';
        subjectBtn.dataset.subject = subject.key || subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
        subjectBtn.dataset.id = subject.id || subject.key;
        subjectBtn.textContent = subject.name;
        
        
        subjectBtn.addEventListener('click', handleSubjectClick);
        
        subjectsList.appendChild(subjectBtn);
    });
    
    subjectsContainer.appendChild(subjectsList);
    
    
    notesContainer.innerHTML = '';
    notesContainer.appendChild(subjectsContainer);
    
    
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(notesContainer);
    }
}


function createNoteCard(note) {
    const thumbnailUrl = note.thumbnailUrl || 'assets/pdf-icon.png';
    
    const card = document.createElement('div');
    card.className = 'note-card';
    
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
    
    
    let driveUrl = note.url || note.link;
    
    if (!driveUrl) {
        console.warn('Note is missing URL:', note);
        driveUrl = '#'; 
    } else if (driveUrl.includes('localhost') || driveUrl.includes('undefined')) {
        
        console.warn('Fixing malformed URL:', driveUrl);
        if (driveUrl.includes('drive.google.com')) {
            
            const match = driveUrl.match(/drive\.google\.com.*/);
            if (match) {
                driveUrl = 'https://' + match[0];
            }
        }
    } else if (!driveUrl.startsWith('http://') && !driveUrl.startsWith('https://')) {
        
        driveUrl = 'https://' + driveUrl.replace(/^\/\\/, '');
    }
    
    
    try {
        new URL(driveUrl);
    } catch (e) {
        console.error('Invalid URL after formatting:', driveUrl);
        driveUrl = '#'; 
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
    
    
    const driveLink = card.querySelector('.drive-link');
    if (driveLink) {
        driveLink.addEventListener('click', function(e) {
            if (driveUrl === '#') {
                e.preventDefault();
                console.error('Unable to open invalid drive link');
                return;
            }
            
            
            if (!driveUrl.includes('drive.google.com')) {
                console.warn('Non-Google Drive URL detected:', driveUrl);
            }
        });
    }
    
    return card;
}


function displayNotes(notes, semester, subject) {
    if (!notesContainer) return;
    
    if (!notes || Object.keys(notes).length === 0) {
        displayEmptyState(`No notes found for this subject.`);
        return;
    }
    
    
    const activeSubjectBtn = document.querySelector('.subject-btn.active');
    const subjectName = activeSubjectBtn ? activeSubjectBtn.textContent : 'Subject';
    
    
    const notesList = document.createElement('div');
    notesList.className = 'notes-list';
    
    
    const subjectTitle = document.createElement('h3');
    subjectTitle.className = 'subject-title';
    subjectTitle.textContent = subjectName;
    notesList.appendChild(subjectTitle);
    
    
    const notesGrid = document.createElement('div');
    notesGrid.className = 'notes-grid';
    
    
    Object.keys(notes).forEach(key => {
        const note = notes[key];
        const noteCard = createNoteCard(note);
        notesGrid.appendChild(noteCard);
    });
    
    
    notesList.appendChild(notesGrid);
    
    
    const existingNotesList = document.querySelector('.notes-list');
    if (existingNotesList) {
        existingNotesList.remove();
    }
    
    
    notesContainer.appendChild(notesList);
    
    
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(notesContainer);
    }
}


function displayEmptyState(message = 'There are no notes available for this semester yet.') {
    if (!notesContainer) return;
    
    
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
        
        notesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>${message}</p>
            </div>
        `;
    }
}


function displayError() {
    if (!notesContainer) return;
    
    notesContainer.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load notes. Please try again later.</p>
        </div>
    `;
}


function handleSemesterChange(event) {
    const semester = event.target.dataset.sem;
    
    
    semesterTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    
    currentSemester = semester;
    loadNotes(semester);
}


function handleSubjectClick(event) {
    const subject = event.target.dataset.subject;
    const subjectName = event.target.textContent || 'Subject';
    
    
    const subjectBtns = document.querySelectorAll('.subject-btn');
    subjectBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    
    const backButton = document.querySelector('.back-button');
    if (backButton) backButton.classList.remove('hidden');
    
    
    loadNotes(currentSemester, subject);
} 
