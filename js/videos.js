/**
 * Videos module for KKNotes
 * Handles all video listing and display functionality
 */

// DOM Elements
const videoSemesterTabs = document.querySelectorAll('.videos-section .sem-tab');
const videosContainer = document.getElementById('videos-container');

// Current active semester and subject for videos
let currentVideoSemester = 's1'; // Default to S1
let currentVideoSubject = null; // No subject selected by default
let videoRefreshInterval; // Add variable for refresh interval

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeVideos);
videoSemesterTabs.forEach(tab => tab.addEventListener('click', handleVideoSemesterChange));

/**
 * Initialize videos functionality
 */
function initializeVideos() {
    console.log('Initializing videos functionality...');
    
    // Load videos for the default semester (S1)
    loadVideos(currentVideoSemester);
}

/**
 * Load videos for a specific semester
 * @param {string} semester - The semester code (s1, s2, etc.)
 * @param {string} subject - Optional subject key to filter videos by
 * @param {boolean} showLoader - Whether to show the loading spinner (default: false)
 */
function loadVideos(semester, subject = null, showLoader = false) {
    // Reset current subject if loading a different semester
    if (currentVideoSubject !== subject) {
        currentVideoSubject = subject;
    }
    
    // Clear any existing refresh interval
    if (videoRefreshInterval) {
        clearInterval(videoRefreshInterval);
    }
    
    // Set a timeout to handle potential long loading times and fallback
    const timeoutId = setTimeout(() => {
        console.warn('Firebase request taking longer than expected, showing empty state as fallback');
        // If container hasn't been updated, show empty state
        displayVideoEmptyState('Could not load content. Please try again later.');
    }, 8000);
    
    try {
        // Check if we should load subjects or videos
        if (!subject) {
            // Load subjects for this semester from Firebase
            database.ref(`subjects/${semester}`).once('value')
                .then(snapshot => {
                    clearTimeout(timeoutId);
                    const subjects = snapshot.val();
                    if (subjects) {
                        console.log(`Successfully loaded subjects for videos (${semester})`);
                        displayVideoSubjects(subjects, semester);
                    } else {
                        console.log(`No subjects found for videos (${semester})`);
                        displayVideoEmptyState('No subjects found for this semester.');
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('Error loading subjects for videos:', error);
                    displayVideoError();
                    
                    // Try to recover by using the error handling function from main.js
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load video subjects. Please try again later.');
                    }
                });
            
            // Set up refresh interval (30 seconds)
            videoRefreshInterval = setInterval(() => {
                console.log('Refreshing video subjects data...');
                loadVideos(semester, subject, false); // Don't show loading spinner on refresh
            }, 30000);
        } else {
            // Load videos for selected subject from Firebase
            database.ref(`videos/${semester}/${subject}`).once('value')
                .then(snapshot => {
                    clearTimeout(timeoutId);
                    const videos = snapshot.val();
                    if (videos) {
                        console.log(`Successfully loaded videos for ${semester}/${subject}`);
                        
                        // Process each video to ensure URLs are formatted correctly
                        Object.keys(videos).forEach(key => {
                            // IMPORTANT FIX: Support both 'url' and 'link' fields
                            // Copy the link field to url field if url is missing but link exists
                            if (!videos[key].url && videos[key].link) {
                                videos[key].url = videos[key].link;
                                console.log(`Fixed: Copied link field to url field for ${key}:`, videos[key].link);
                            }
                            
                            // Fix URL if it exists
                            let url = videos[key].url || videos[key].link || '';
                            if (url) {
                                console.log(`Processing video URL: ${url}`);
                                
                                // Determine content type (video, playlist, channel)
                                if (url.includes('youtube.com/playlist') || url.includes('list=')) {
                                    videos[key].contentType = 'playlist';
                                } else if (url.includes('youtube.com/channel/') || url.includes('youtube.com/c/') || url.includes('youtube.com/user/')) {
                                    videos[key].contentType = 'channel';
                                } else {
                                    videos[key].contentType = 'video';
                                }
                                
                                // Check if it's a relative URL that would resolve to localhost
                                if (url.startsWith('/') && !url.startsWith('//')) {
                                    console.warn(`Found relative URL that would resolve to localhost: ${url}`);
                                    
                                    // If it's a YouTube relative URL, fix it
                                    if (url.includes('youtu.be/')) {
                                        const videoIdMatch = url.match(/\/youtu\.be\/([a-zA-Z0-9_-]+)/);
                                        if (videoIdMatch && videoIdMatch[1]) {
                                            const videoId = videoIdMatch[1];
                                            url = `https://youtu.be/${videoId}`;
                                            videos[key].youtubeId = videoId;
                                            console.log(`Fixed relative youtu.be URL: ${url}`);
                                        }
                                    } else if (url.includes('youtube.com')) {
                                        const match = url.match(/(youtube\.com.+)/);
                                        if (match) {
                                            url = 'https://www.' + match[0];
                                            console.log(`Fixed relative YouTube URL: ${url}`);
                                            
                                            // Try to extract video ID
                                            const videoIdMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
                                            if (videoIdMatch && videoIdMatch[1]) {
                                                videos[key].youtubeId = videoIdMatch[1];
                                            }
                                        }
                                    }
                                }
                                
                                // Fix malformed URLs containing localhost or undefined
                                if (url.includes('localhost') || url.includes('undefined')) {
                                    console.warn(`Fixing malformed URL containing localhost: ${url}`);
                                    
                                    if (url.includes('youtu.be')) {
                                        // Extract the youtu.be portion and video ID
                                        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                                        if (match && match[1]) {
                                            const videoId = match[1];
                                            url = `https://youtu.be/${videoId}`;
                                            videos[key].youtubeId = videoId;
                                            console.log(`Fixed youtu.be URL with localhost: ${url}`);
                                        }
                                    } else if (url.includes('youtube.com')) {
                                        // Extract the YouTube portion
                                        const match = url.match(/youtube\.com.+/);
                                        if (match) {
                                            url = 'https://www.' + match[0];
                                            console.log(`Fixed YouTube URL with localhost: ${url}`);
                                            
                                            // Try to extract video ID
                                            const videoIdMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
                                            if (videoIdMatch && videoIdMatch[1]) {
                                                videos[key].youtubeId = videoIdMatch[1];
                                            }
                                        }
                                    }
                                }
                                
                                // Add protocol if missing
                                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                    // Missing protocol
                                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                        url = 'https://' + url.replace(/^\/\//, '');
                                        console.log(`Added protocol to URL: ${url}`);
                                    }
                                }
                                
                                // If it's a youtu.be URL, make sure we have the video ID
                                if (url.includes('youtu.be/') && !videos[key].youtubeId) {
                                    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                                    if (match && match[1]) {
                                        videos[key].youtubeId = match[1];
                                        console.log(`Extracted video ID from youtu.be URL: ${match[1]}`);
                                    }
                                }
                                
                                // Validate URL if possible
                                try {
                                    new URL(url);
                                    // Update the URL in the data
                                    videos[key].url = url;
                                } catch (error) {
                                    console.error(`Invalid URL after formatting: ${url}`, error);
                                    
                                    // If we have a video ID, create a proper YouTube URL
                                    if (videos[key].youtubeId) {
                                        videos[key].url = `https://www.youtube.com/watch?v=${videos[key].youtubeId}`;
                                        console.log(`Created fallback URL from video ID: ${videos[key].url}`);
                                    }
                                }
                            }
                        });
                        
                        displayVideos(videos, semester, subject);
                    } else {
                        console.log(`No videos found for ${semester}/${subject}`);
                        displayVideoEmptyState(`No videos found for this subject.`);
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error('Error loading videos:', error);
                    displayVideoError();
                    
                    // Try to recover by using the error handling function from main.js
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load videos. Please try again later.');
                    }
                });
            
            // Set up refresh interval (30 seconds)
            videoRefreshInterval = setInterval(() => {
                console.log('Refreshing videos data...');
                loadVideos(semester, subject, false); // Don't show loading spinner on refresh
            }, 30000);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Unexpected error in loadVideos:', error);
        displayVideoError();
    }
}

/**
 * Display subjects for video selection
 * @param {Array} subjects - The subjects array from Firebase
 * @param {string} semester - The current semester code
 */
function displayVideoSubjects(subjects, semester) {
    if (!videosContainer) return;
    
    // Create container for subjects
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'subjects-container';
    
    // Add semester title
    const semTitle = document.createElement('h3');
    semTitle.className = 'semester-title';
    semTitle.textContent = `Semester ${semester.substring(1)} Videos`;
    subjectsContainer.appendChild(semTitle);
    
    // Create subject list
    const subjectsList = document.createElement('div');
    subjectsList.className = 'subjects-list';
    
    // Create back button for mobile (only shown when viewing videos)
    const backButton = document.createElement('button');
    backButton.className = 'back-button hidden';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Subjects';
    backButton.addEventListener('click', () => {
        currentVideoSubject = null;
        loadVideos(currentVideoSemester);
    });
    subjectsContainer.appendChild(backButton);
    
    // Add each subject as a button
    subjects.forEach(subject => {
        const subjectBtn = document.createElement('button');
        subjectBtn.className = 'subject-btn';
        subjectBtn.dataset.subject = subject.key || subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
        subjectBtn.dataset.id = subject.id || subject.key;
        subjectBtn.textContent = subject.name;
        
        // Add click event to load videos for this subject
        subjectBtn.addEventListener('click', handleVideoSubjectClick);
        
        subjectsList.appendChild(subjectBtn);
    });
    
    subjectsContainer.appendChild(subjectsList);
    
    // Clear container and add subjects
    videosContainer.innerHTML = '';
    videosContainer.appendChild(subjectsContainer);
    
    // Apply animation for smooth transition
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(videosContainer);
    }
}

/**
 * Sanitize and fix YouTube URLs coming from Firebase
 * @param {Object} videoData - Raw video data from Firebase
 * @returns {Object} - Sanitized video data with fixed URLs
 */
function sanitizeVideoData(videoData) {
    if (!videoData) return videoData;
    
    // Create a shallow copy to avoid modifying the original object directly
    const video = {...videoData};
    
    // Handle URL similar to how we do it in createVideoCard
    if (video.url) {
        let url = video.url.trim();
        
        // Fix malformed URLs containing localhost or undefined
        if (url.includes('localhost') || url.includes('undefined')) {
            if (url.includes('youtube.com')) {
                // Extract the YouTube portion from the malformed URL
                const match = url.match(/youtube\.com.*/);
                if (match) {
                    url = 'https://www.' + match[0];
                    console.log('Sanitizer: Fixed YouTube URL:', url);
                }
            } else if (url.includes('youtu.be')) {
                // Extract the youtu.be portion from the malformed URL
                const match = url.match(/youtu\.be.*/);
                if (match) {
                    url = 'https://' + match[0];
                    console.log('Sanitizer: Fixed youtu.be URL:', url);
                }
            }
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Add https:// prefix if missing
            url = 'https://' + url.replace(/^\/\//, '');
            console.log('Sanitizer: Added https:// prefix to URL:', url);
        }
        
        // Update the URL in the copy
        video.url = url;
    }
    
    console.log('Sanitized video data:', video);
    return video;
}

/**
 * Create a video card element
 * @param {Object} video - The video object
 * @returns {HTMLElement} - The video card element
 */
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    // IMPORTANT FIX: Support both 'url' and 'link' fields
    // Copy the link field to url field if url is missing but link exists
    if (!video.url && video.link) {
        video.url = video.link;
        console.log('Fixed: Copied link field to url field:', video.link);
    }
    
    // For debugging - add data-* attributes with the video details
    if (video.url) card.dataset.url = video.url;
    if (video.link) card.dataset.link = video.link;
    if (video.youtubeId) card.dataset.youtubeId = video.youtubeId;
    
    // Set content type if not already set
    const contentType = video.contentType || 'video';
    
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
    
    // Use the direct values from the video object
    let videoId = video.youtubeId || '';
    
    // Handle URL similar to notes.js to fix localhost redirects
    let youtubeUrl = video.url || '';
    let hasURLIssue = false;
    
    // If URL isn't set, default to a safe value
    if (!youtubeUrl) {
        console.warn('Video is missing URL:', video);
        youtubeUrl = '#'; // Fallback to prevent broken links
        hasURLIssue = true;
    }
    
    // Special fix for relative URLs (the main cause of localhost issues)
    if (youtubeUrl.startsWith('/') && !youtubeUrl.startsWith('//')) {
        // This is a relative URL which will resolve to the current domain (localhost)
        console.warn('Found relative URL that would resolve to localhost:', youtubeUrl);
        hasURLIssue = true;
        
        // Check if it contains YouTube identifiers
        if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
            const match = youtubeUrl.match(/(youtube\.com|youtu\.be).*/);
            if (match) {
                youtubeUrl = 'https://www.' + match[0];
                console.log('Fixed relative YouTube URL:', youtubeUrl);
            }
        }
    }
    
    // Direct fix for youtu.be URLs from the database
    if (youtubeUrl.includes('youtu.be/')) {
        // Extract the video ID from youtu.be URL
        const parts = youtubeUrl.split('youtu.be/');
        if (parts.length > 1) {
            const videoIdPart = parts[1].split('?')[0].split('&')[0];
            // Set it as the video ID for thumbnail and as backup
            if (videoIdPart && videoIdPart.length > 0) {
                videoId = videoIdPart;
                console.log('Extracted video ID from youtu.be URL:', videoId);
                
                // Ensure the URL is absolute
                if (!youtubeUrl.startsWith('http')) {
                    if (youtubeUrl.startsWith('//')) {
                        youtubeUrl = 'https:' + youtubeUrl;
                    } else if (youtubeUrl.startsWith('/')) {
                        youtubeUrl = 'https://youtu.be' + youtubeUrl.substring(8); // Skip "/youtu.be"
                    } else {
                        youtubeUrl = 'https://youtu.be/' + videoIdPart;
                    }
                    console.log('Fixed youtu.be URL to absolute:', youtubeUrl);
                    hasURLIssue = true;
                }
            }
        }
    }
    
    // Fix malformed URLs containing localhost or undefined
    if (youtubeUrl.includes('localhost') || youtubeUrl.includes('undefined')) {
        console.warn('Fixing malformed URL with localhost:', youtubeUrl);
        hasURLIssue = true;
        if (youtubeUrl.includes('youtube.com')) {
            // Extract the YouTube portion from the malformed URL
            const match = youtubeUrl.match(/youtube\.com.*/);
            if (match) {
                youtubeUrl = 'https://www.' + match[0];
                console.log('Fixed YouTube URL:', youtubeUrl);
            }
        } else if (youtubeUrl.includes('youtu.be')) {
            // Extract the youtu.be portion from the malformed URL
            const match = youtubeUrl.match(/youtu\.be.*/);
            if (match) {
                youtubeUrl = 'https://' + match[0];
                console.log('Fixed youtu.be URL:', youtubeUrl);
            }
        } else if (videoId) {
            // If we have a video ID but the URL is malformed, create a proper URL
            youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log('Created proper URL from video ID:', youtubeUrl);
        }
    }
    
    // Add https:// prefix if missing and not already handled
    if (!youtubeUrl.startsWith('http://') && !youtubeUrl.startsWith('https://') && youtubeUrl !== '#') {
        hasURLIssue = true;
        youtubeUrl = 'https://' + youtubeUrl.replace(/^\/\//, '');
        console.log('Added https:// prefix to URL:', youtubeUrl);
    }
    
    try {
        // Try to validate the URL
        new URL(youtubeUrl);
    } catch (error) {
        console.error('Invalid URL after formatting:', youtubeUrl, error);
        hasURLIssue = true;
        // If we have a video ID, create a proper YouTube URL
        if (videoId) {
            youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log('Created fallback URL from video ID:', youtubeUrl);
        } else {
            youtubeUrl = '#'; // Fallback to prevent broken links
        }
    }
    
    // Direct logging of the values we're using
    console.log('Final values:', { videoId, youtubeUrl, title: video.title, hasURLIssue, contentType });
    
    // Set play button icon and label based on content type
    let playButtonIcon = 'fa-play';
    let watchButtonLabel = 'Watch on YouTube';
    let contentTypeLabel = '';
    
    if (contentType === 'playlist') {
        playButtonIcon = 'fa-list';
        watchButtonLabel = 'Open Playlist';
        contentTypeLabel = '<span class="content-type-label" style="position: absolute !important; top: 10px !important; right: 10px !important; background-color: rgba(255, 0, 0, 0.8) !important; color: white !important; font-size: 12px !important; padding: 4px 8px !important; border-radius: 4px !important; z-index: 2 !important;"><i class="fas fa-list" style="margin-right: 4px !important;"></i> Playlist</span>';
    } else if (contentType === 'channel') {
        playButtonIcon = 'fa-user';
        watchButtonLabel = 'Visit Channel';
        contentTypeLabel = '<span class="content-type-label" style="position: absolute !important; top: 10px !important; right: 10px !important; background-color: rgba(255, 0, 0, 0.8) !important; color: white !important; font-size: 12px !important; padding: 4px 8px !important; border-radius: 4px !important; z-index: 2 !important;"><i class="fas fa-user" style="margin-right: 4px !important;"></i> Channel</span>';
    }
    
    // YouTube thumbnail URL - use HD quality when available
    let thumbnailUrl;
    if (videoId && contentType === 'video') {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else if (contentType === 'playlist') {
        thumbnailUrl = 'assets/playlist-placeholder.jpg';
    } else if (contentType === 'channel') {
        thumbnailUrl = 'assets/channel-placeholder.jpg';
    } else {
        thumbnailUrl = 'assets/video-placeholder.jpg';
    }
    
    // Format duration if available
    const duration = video.duration ? formatDuration(video.duration) : '';
    
    // Create card with YouTube-like appearance
    card.innerHTML = `
        <div class="video-preview" style="position: relative !important; overflow: hidden !important; padding-bottom: 60% !important; border-radius: 20px 20px 0 0 !important; background-color: black !important;">
            <img src="${thumbnailUrl}" alt="${video.title}" class="video-thumbnail" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important;" onerror="this.src='assets/video-placeholder.jpg'">
            <div class="video-play-button" style="position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 60px !important; height: 60px !important; background-color: rgba(255, 0, 0, 0.8) !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 2 !important;">
                <i class="fas ${playButtonIcon}" style="color: white !important; font-size: 24px !important;"></i>
            </div>
            ${contentTypeLabel}
            ${duration && contentType === 'video' ? `<span class="video-duration" style="position: absolute !important; bottom: 10px !important; right: 10px !important; background-color: rgba(0, 0, 0, 0.7) !important; color: white !important; font-size: 12px !important; padding: 4px 8px !important; border-radius: 4px !important; z-index: 2 !important;"><i class="far fa-clock" style="margin-right: 4px !important;"></i> ${duration}</span>` : ''}
        </div>
        <div class="video-info" style="padding: 28px !important; flex: 1 !important; display: flex !important; flex-direction: column !important; position: relative !important;">
            <h3 class="video-title" style="font-size: 22px !important; margin: 0 0 16px 0 !important; max-height: 62px !important; line-height: 1.4 !important; font-weight: 600 !important; color: #1f2937 !important;">${video.title}</h3>
            <p class="video-description" style="font-size: 16px !important; margin-bottom: 24px !important; line-height: 1.5 !important; flex: 1 !important; color: #4b5563 !important;">${video.description || 'No description available.'}</p>
            <div class="video-meta" style="margin-bottom: 16px !important; display: flex !important; align-items: center !important;">
                ${video.creator ? `<span class="video-creator" style="font-size: 14px !important; color: #6b7280 !important; display: flex !important; align-items: center !important;"><i class="fas fa-user" style="margin-right: 5px !important;"></i> ${video.creator}</span>` : ''}
            </div>
            <div class="video-actions" style="display: flex !important; flex-direction: column !important; gap: 10px !important; margin-top: auto !important;">
                <button id="yt-button-${videoId || Math.random().toString(36).substr(2, 9)}" class="youtube-button" style="width: 100% !important; padding: 12px 18px !important; font-weight: 600 !important; font-size: 16px !important; border-radius: 50px !important; background-color: rgba(255, 0, 0, 0.1) !important; color: #FF0000 !important; text-align: center !important; display: flex !important; justify-content: center !important; align-items: center !important; text-decoration: none !important; border: none !important; cursor: pointer !important;">
                    <i class="fab fa-youtube" style="margin-right: 8px !important;"></i> ${watchButtonLabel}
                </button>
                ${hasURLIssue ? `
                <div class="manual-url-section" style="margin-top: 5px; text-align: center;">
                    <div style="margin-bottom: 8px; font-size: 13px; color: #6b7280;">
                        If the button doesn't work, copy this URL:
                    </div>
                    <input type="text" value="${youtubeUrl}" readonly style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px; margin-bottom: 8px;" onclick="this.select();">
                    <button onclick="navigator.clipboard.writeText('${youtubeUrl}').then(() => alert('URL copied to clipboard!'))" style="background: #f3f4f6; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">
                        Copy URL
                    </button>
                </div>
                ` : ''}
                <div class="debug-info" style="font-size: 12px; text-align: center; color: #6b7280; margin-top: 5px; overflow-wrap: break-word;">
                    <span class="debug-toggle" style="cursor: pointer; text-decoration: underline;">${hasURLIssue ? 'Show More Debug Info' : 'Show Debug Info'}</span>
                    <div class="debug-details" style="display: ${hasURLIssue ? 'block' : 'none'}; margin-top: 5px; text-align: left; background: #f9fafb; padding: 5px; border-radius: 4px;">
                        <div>Type: ${contentType}</div>
                        <div>URL: ${youtubeUrl || 'Not available'}</div>
                        <div>Video ID: ${videoId || 'Not available'}</div>
                        <div>Original URL: ${video.url || 'Not set'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to toggle debug info
    const debugToggle = card.querySelector('.debug-toggle');
    const debugDetails = card.querySelector('.debug-details');
    
    if (debugToggle && debugDetails) {
        debugToggle.addEventListener('click', () => {
            const isHidden = debugDetails.style.display === 'none';
            debugDetails.style.display = isHidden ? 'block' : 'none';
            debugToggle.textContent = isHidden ? 'Hide Debug Info' : (hasURLIssue ? 'Show More Debug Info' : 'Show Debug Info');
        });
    }
    
    // Add custom handler for YouTube button to bypass any framework interference
    const ytButtonId = `yt-button-${videoId || Math.random().toString(36).substr(2, 9)}`;
    const ytButton = card.querySelector(`#${ytButtonId}`);
    if (ytButton && youtubeUrl && youtubeUrl !== '#') {
        ytButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('YouTube button clicked, opening URL:', youtubeUrl, 'Content type:', contentType);
            
            // First fix common URL issues
            let finalUrl = youtubeUrl;
            
            // SPECIAL FIX: Direct handler for youtu.be links
            if (youtubeUrl.includes('youtu.be/')) {
                const videoIdMatch = youtubeUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                if (videoIdMatch && videoIdMatch[1]) {
                    const directYoutubeId = videoIdMatch[1].split('?')[0];
                    console.log('Processing youtu.be video:', directYoutubeId);
                    finalUrl = `https://www.youtube.com/watch?v=${directYoutubeId}`;
                }
            }
            
            // Special handling for playlists
            if (contentType === 'playlist') {
                // Extract playlist ID if possible
                const playlistMatch = youtubeUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
                if (playlistMatch && playlistMatch[1]) {
                    finalUrl = `https://www.youtube.com/playlist?list=${playlistMatch[1]}`;
                    console.log('Opening playlist:', finalUrl);
                }
            }
            
            // Special handling for channels
            if (contentType === 'channel') {
                // Ensure it's a proper channel URL
                if (youtubeUrl.includes('/channel/') || youtubeUrl.includes('/c/') || youtubeUrl.includes('/user/')) {
                    finalUrl = youtubeUrl;
                    console.log('Opening channel:', finalUrl);
                }
            }
            
            // Open the URL
            try {
                console.log('Opening final URL:', finalUrl);
                window.open(finalUrl, '_blank');
            } catch (error) {
                console.error('Error opening URL:', error);
                // Fallback to direct navigation
                window.location.href = finalUrl;
            }
            
            return false; // Prevent default and stop propagation
        });
    }
    
    // Add click handler to YouTube preview for extra reliability
    const previewElement = card.querySelector('.video-preview');
    if (previewElement && youtubeUrl && youtubeUrl !== '#') {
        previewElement.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Opening YouTube from preview:', youtubeUrl);
            // Trigger the same action as the button
            ytButton.click();
        });
    }
    
    return card;
}

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Display videos in the container
 * @param {Object} videos - The videos object from Firebase
 * @param {string} semester - The current semester code
 * @param {string} subject - The current subject key
 */
function displayVideos(videos, semester, subject) {
    if (!videosContainer) return;
    
    if (!videos || Object.keys(videos).length === 0) {
        displayVideoEmptyState(`No videos found for this subject.`);
        return;
    }
    
    // Get the subject name from the active button
    const activeSubjectBtn = document.querySelector('.videos-section .subject-btn.active');
    const subjectName = activeSubjectBtn ? activeSubjectBtn.textContent : 'Subject';
    
    // Create videos list container
    const videosList = document.createElement('div');
    videosList.className = 'videos-list';
    
    // Add subject title
    const subjectTitle = document.createElement('h3');
    subjectTitle.className = 'subject-title';
    subjectTitle.textContent = subjectName;
    videosList.appendChild(subjectTitle);
    
    // Create grid container for the cards
    const videosGrid = document.createElement('div');
    videosGrid.className = 'videos-grid';
    
    // Add each video as a card
    Object.keys(videos).forEach(key => {
        // Sanitize the video data before creating the card
        const sanitizedVideo = sanitizeVideoData(videos[key]);
        const videoCard = createVideoCard(sanitizedVideo);
        videosGrid.appendChild(videoCard);
    });
    
    // Add grid to list
    videosList.appendChild(videosGrid);
    
    // Clear videos area (keeping subject list)
    const existingVideosList = document.querySelector('.videos-section .videos-list');
    if (existingVideosList) {
        existingVideosList.remove();
    }
    
    // Add the videos list
    videosContainer.appendChild(videosList);
    
    // Apply animation for smooth transition
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(videosContainer);
    }
}

/**
 * Display empty state with custom message for videos
 * @param {string} message - Custom message to display
 */
function displayVideoEmptyState(message = 'There are no videos available for this semester yet.') {
    if (!videosContainer) return;
    
    // If we're viewing a subject, only update the videos area
    const existingSubjectsContainer = document.querySelector('.videos-section .subjects-container');
    const existingVideosList = document.querySelector('.videos-section .videos-list');
    
    if (currentVideoSubject && existingSubjectsContainer && existingVideosList) {
        existingVideosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <p>${message}</p>
            </div>
        `;
    } else {
        // Otherwise, update the entire container
        videosContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

/**
 * Display error state when videos can't be loaded
 */
function displayVideoError() {
    if (!videosContainer) return;
    
    videosContainer.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load videos. Please try again later.</p>
        </div>
    `;
}

/**
 * Handle video semester tab change
 * @param {Event} event - The click event
 */
function handleVideoSemesterChange(event) {
    const semester = event.target.dataset.sem;
    
    // Update active tab
    videoSemesterTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update current semester and load videos
    currentVideoSemester = semester;
    loadVideos(semester);
}

/**
 * Handle video subject button click
 * @param {Event} event - The click event
 */
function handleVideoSubjectClick(event) {
    const subject = event.target.dataset.subject;
    const subjectName = event.target.textContent || 'Subject';
    
    // Update active subject button
    const subjectBtns = document.querySelectorAll('.videos-section .subject-btn');
    subjectBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show back button on mobile
    const backButton = document.querySelector('.videos-section .back-button');
    if (backButton) backButton.classList.remove('hidden');
    
    // Load videos for this subject
    loadVideos(currentVideoSemester, subject);
}