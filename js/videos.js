const videoSemesterTabs = document.querySelectorAll('.videos-section .sem-tab');
const videosContainer = document.getElementById('videos-container');


let currentVideoSemester = 's1'; 
let currentVideoSubject = null; 
let videoRefreshInterval; 


document.addEventListener('DOMContentLoaded', initializeVideos);
videoSemesterTabs.forEach(tab => tab.addEventListener('click', handleVideoSemesterChange));


function initializeVideos() {
    console.log('Initializing videos functionality...');
    
    
    loadVideos(currentVideoSemester);
}


function loadVideos(semester, subject = null, showLoader = false) {
    
    if (currentVideoSubject !== subject) {
        currentVideoSubject = subject;
    }
    
    
    if (videoRefreshInterval) {
        clearInterval(videoRefreshInterval);
    }
    
    
    const timeoutId = setTimeout(() => {
        console.warn('Firebase request taking longer than expected, showing empty state as fallback');
        
        displayVideoEmptyState('Could not load content. Please try again later.');
    }, 8000);
    
    try {
        
        if (!subject) {
            
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
                    
                    
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load video subjects. Please try again later.');
                    }
                });
            
            
            videoRefreshInterval = setInterval(() => {
                console.log('Refreshing video subjects data...');
                loadVideos(semester, subject, false); 
            }, 30000);
        } else {
            
            database.ref(`videos/${semester}/${subject}`).once('value')
                .then(snapshot => {
                    clearTimeout(timeoutId);
                    const videos = snapshot.val();
                    if (videos) {
                        console.log(`Successfully loaded videos for ${semester}/${subject}`);
                        
                        
                        Object.keys(videos).forEach(key => {
                            
                            
                            if (!videos[key].url && videos[key].link) {
                                videos[key].url = videos[key].link;
                                console.log(`Fixed: Copied link field to url field for ${key}:`, videos[key].link);
                            }
                            
                            
                            let url = videos[key].url || videos[key].link || '';
                            if (url) {
                                console.log(`Processing video URL: ${url}`);
                                
                                
                                if (url.includes('youtube.com/playlist') || url.includes('list=')) {
                                    videos[key].contentType = 'playlist';
                                    console.log(`Detected playlist: ${url}`);
                                    
                                    
                                    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
                                    if (playlistMatch && playlistMatch[1]) {
                                        videos[key].playlistId = playlistMatch[1];
                                        console.log(`Extracted playlist ID: ${videos[key].playlistId}`);
                                    }
                                } else if (url.includes('youtube.com/channel/') || url.includes('youtube.com/c/') || url.includes('youtube.com/user/')) {
                                    videos[key].contentType = 'channel';
                                } else {
                                    videos[key].contentType = 'video';
                                }
                                
                                
                                if (url.startsWith('/') && !url.startsWith('//')) {
                                    console.warn(`Found relative URL that would resolve to localhost: ${url}`);
                                    
                                    
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
                                            
                                            
                                            const videoIdMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
                                            if (videoIdMatch && videoIdMatch[1]) {
                                                videos[key].youtubeId = videoIdMatch[1];
                                            }
                                        }
                                    }
                                }
                                
                                
                                if (url.includes('playlist') || url.includes('list=')) {
                                    console.log('Detected playlist URL:', url);
                                    videos[key].contentType = 'playlist';
                                    
                                    
                                    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
                                    if (playlistMatch && playlistMatch[1]) {
                                        videos[key].playlistId = playlistMatch[1];
                                        console.log('Extracted playlist ID:', videos[key].playlistId);
                                    }
                                }
                                
                                
                                if (url.includes('localhost') || url.includes('undefined')) {
                                    console.warn(`Fixing malformed URL containing localhost: ${url}`);
                                    
                                    if (url.includes('youtu.be')) {
                                        
                                        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                                        if (match && match[1]) {
                                            const videoId = match[1];
                                            url = `https://youtu.be/${videoId}`;
                                            videos[key].youtubeId = videoId;
                                            console.log(`Fixed youtu.be URL with localhost: ${url}`);
                                        }
                                    } else if (url.includes('youtube.com')) {
                                        
                                        const match = url.match(/youtube\.com.+/);
                                        if (match) {
                                            url = 'https://www.' + match[0];
                                            console.log(`Fixed YouTube URL with localhost: ${url}`);
                                            
                                            
                                            const videoIdMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
                                            if (videoIdMatch && videoIdMatch[1]) {
                                                videos[key].youtubeId = videoIdMatch[1];
                                            }
                                        }
                                    }
                                }
                                
                                
                                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                    
                                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                        url = 'https://' + url.replace(/^\/\\/, '');
                                        console.log(`Added protocol to URL: ${url}`);
                                    }
                                }
                                
                                
                                if (url.includes('youtu.be/') && !videos[key].youtubeId) {
                                    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
                                    if (match && match[1]) {
                                        videos[key].youtubeId = match[1];
                                        console.log(`Extracted video ID from youtu.be URL: ${match[1]}`);
                                    }
                                }
                                
                                
                                try {
                                    new URL(url);
                                    
                                    videos[key].url = url;
                                } catch (error) {
                                    console.error(`Invalid URL after formatting: ${url}`, error);
                                    
                                    
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
                    
                    
                    if (window.handleError) {
                        window.handleError(error, 'Failed to load videos. Please try again later.');
                    }
                });
            
            
            videoRefreshInterval = setInterval(() => {
                console.log('Refreshing videos data...');
                loadVideos(semester, subject, false); 
            }, 30000);
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Unexpected error in loadVideos:', error);
        displayVideoError();
    }
}


function displayVideoSubjects(subjects, semester) {
    if (!videosContainer) return;
    
    
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'subjects-container';
    
    
    const semTitle = document.createElement('h3');
    semTitle.className = 'semester-title';
    semTitle.textContent = `Semester ${semester.substring(1)} Videos`;
    subjectsContainer.appendChild(semTitle);
    
    
    const subjectsList = document.createElement('div');
    subjectsList.className = 'subjects-list';
    
    
    const backButton = document.createElement('button');
    backButton.className = 'back-button hidden';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Subjects';
    backButton.addEventListener('click', () => {
        currentVideoSubject = null;
        loadVideos(currentVideoSemester);
    });
    subjectsContainer.appendChild(backButton);
    
    
    subjects.forEach(subject => {
        const subjectBtn = document.createElement('button');
        subjectBtn.className = 'subject-btn';
        subjectBtn.dataset.subject = subject.key || subject.id || subject.name.toLowerCase().replace(/\s+/g, '-');
        subjectBtn.dataset.id = subject.id || subject.key;
        subjectBtn.textContent = subject.name;
        
        
        subjectBtn.addEventListener('click', handleVideoSubjectClick);
        
        subjectsList.appendChild(subjectBtn);
    });
    
    subjectsContainer.appendChild(subjectsList);
    
    
    videosContainer.innerHTML = '';
    videosContainer.appendChild(subjectsContainer);
    
    
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(videosContainer);
    }
}


function sanitizeVideoData(videoData) {
    if (!videoData) return videoData;
    
    
    const video = {...videoData};
    
    
    if (video.url) {
        let url = video.url.trim();
        
        
        if (url.includes('localhost') || url.includes('undefined')) {
            if (url.includes('youtube.com')) {
                
                const match = url.match(/youtube\.com.*/);
                if (match) {
                    url = 'https://www.' + match[0];
                    console.log('Sanitizer: Fixed YouTube URL:', url);
                }
            } else if (url.includes('youtu.be')) {
                
                const match = url.match(/youtu\.be.*/);
                if (match) {
                    url = 'https://' + match[0];
                    console.log('Sanitizer: Fixed youtu.be URL:', url);
                }
            }
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            
            url = 'https://' + url.replace(/^\/\\/, '');
            console.log('Sanitizer: Added https:// prefix to URL:', url);
        }
        
        
        video.url = url;
    }
    
    console.log('Sanitized video data:', video);
    return video;
}


function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    
    console.log('Creating video card for:', JSON.stringify(video));
    
    
    
    if (!video.url && video.link) {
        video.url = video.link;
        console.log('Fixed: Copied link field to url field:', video.link);
    }
    
    
    let playlistId = null;
    if (video.url && video.url.includes('playlist?list=')) {
        const match = video.url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            playlistId = match[1];
            video.playlistId = playlistId;
            video.contentType = 'playlist';
            console.log('Detected playlist ID directly:', playlistId);
        }
    }
    
    
    if (video.url) card.dataset.url = video.url;
    if (video.link) card.dataset.link = video.link;
    if (video.youtubeId) card.dataset.youtubeId = video.youtubeId;
    if (playlistId || video.playlistId) card.dataset.playlistId = playlistId || video.playlistId;
    
    
    const contentType = video.contentType || 'video';
    
    
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
    
    
    let videoId = video.youtubeId || '';
    
    
    let youtubeUrl = video.url || video.link || '';
    let hasURLIssue = false;
    
    
    if (!youtubeUrl) {
        console.warn('Video is missing URL:', video);
        youtubeUrl = '#'; 
        hasURLIssue = true;
    }
    
    
    if (contentType === 'playlist' && video.playlistId) {
        youtubeUrl = `https://www.youtube.com/playlist?list=${video.playlistId}`;
        console.log('Using direct playlist URL format:', youtubeUrl);
    }
    
    
    if (youtubeUrl.startsWith('/') && !youtubeUrl.startsWith('//')) {
        console.warn('Found relative URL that would resolve to localhost:', youtubeUrl);
        hasURLIssue = true;
        
        
        if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
            const match = youtubeUrl.match(/(youtube\.com|youtu\.be).*/);
            if (match) {
                youtubeUrl = 'https://www.' + match[0];
                console.log('Fixed relative YouTube URL:', youtubeUrl);
            }
        }
    }
    
    
    if (youtubeUrl.includes('youtu.be/')) {
        
        const parts = youtubeUrl.split('youtu.be/');
        if (parts.length > 1) {
            const videoIdPart = parts[1].split('?')[0].split('&')[0];
            
            if (videoIdPart && videoIdPart.length > 0) {
                videoId = videoIdPart;
                console.log('Extracted video ID from youtu.be URL:', videoId);
                
                
                if (!youtubeUrl.startsWith('http')) {
                    if (youtubeUrl.startsWith('//')) {
                        youtubeUrl = 'https:' + youtubeUrl;
                    } else if (youtubeUrl.startsWith('/')) {
                        youtubeUrl = 'https://youtu.be' + youtubeUrl.substring(8); 
                    } else {
                        youtubeUrl = 'https://youtu.be/' + videoIdPart;
                    }
                    console.log('Fixed youtu.be URL to absolute:', youtubeUrl);
                    hasURLIssue = true;
                }
            }
        }
    }
    
    
    if (youtubeUrl.includes('localhost') || youtubeUrl.includes('undefined')) {
        console.warn('Fixing malformed URL with localhost:', youtubeUrl);
        hasURLIssue = true;
        if (youtubeUrl.includes('youtube.com')) {
            
            const match = youtubeUrl.match(/youtube\.com.*/);
            if (match) {
                youtubeUrl = 'https://www.' + match[0];
                console.log('Fixed YouTube URL:', youtubeUrl);
            }
        } else if (youtubeUrl.includes('youtu.be')) {
            
            const match = youtubeUrl.match(/youtu\.be.*/);
            if (match) {
                youtubeUrl = 'https://' + match[0];
                console.log('Fixed youtu.be URL:', youtubeUrl);
            }
        } else if (videoId) {
            
            youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log('Created proper URL from video ID:', youtubeUrl);
        }
    }
    
    
    if (!youtubeUrl.startsWith('http://') && !youtubeUrl.startsWith('https://') && youtubeUrl !== '#') {
        hasURLIssue = true;
        youtubeUrl = 'https://' + youtubeUrl.replace(/^\/\\/, '');
        console.log('Added https:// prefix to URL:', youtubeUrl);
    }
    
    try {
        
        new URL(youtubeUrl);
    } catch (error) {
        console.error('Invalid URL after formatting:', youtubeUrl, error);
        hasURLIssue = true;
        
        if (videoId) {
            youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log('Created fallback URL from video ID:', youtubeUrl);
        } else {
            youtubeUrl = '#'; 
        }
    }
    
    
    console.log('Final values:', { videoId, youtubeUrl, title: video.title, hasURLIssue, contentType });
    
    
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
    
    
    const duration = video.duration ? formatDuration(video.duration) : '';
    
    
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
                <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="youtube-button" style="width: 100% !important; padding: 12px 18px !important; font-weight: 600 !important; font-size: 16px !important; border-radius: 50px !important; background-color: rgba(255, 0, 0, 0.1) !important; color: #FF0000 !important; text-align: center !important; display: flex !important; justify-content: center !important; align-items: center !important; text-decoration: none !important; border: none !important; cursor: pointer !important;">
                    <i class="fab fa-youtube" style="margin-right: 8px !important;"></i> ${watchButtonLabel}
                </a>
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
                        <div>Playlist ID: ${video.playlistId || 'Not available'}</div>
                        <div>Original Link: ${video.link || 'Not set'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    
    const debugToggle = card.querySelector('.debug-toggle');
    const debugDetails = card.querySelector('.debug-details');
    
    if (debugToggle && debugDetails) {
        debugToggle.addEventListener('click', () => {
            const isHidden = debugDetails.style.display === 'none';
            debugDetails.style.display = isHidden ? 'block' : 'none';
            debugToggle.textContent = isHidden ? 'Hide Debug Info' : (hasURLIssue ? 'Show More Debug Info' : 'Show Debug Info');
        });
    }
    
    
    const previewElement = card.querySelector('.video-preview');
    if (previewElement && youtubeUrl && youtubeUrl !== '#') {
        previewElement.style.cursor = 'pointer';
        previewElement.addEventListener('click', (event) => {
            event.preventDefault();
            window.open(youtubeUrl, '_blank');
        });
    }
    
    return card;
}


function formatDuration(seconds) {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


function displayVideos(videos, semester, subject) {
    if (!videosContainer) return;
    
    if (!videos || Object.keys(videos).length === 0) {
        displayVideoEmptyState(`No videos found for this subject.`);
        return;
    }
    
    
    const activeSubjectBtn = document.querySelector('.videos-section .subject-btn.active');
    const subjectName = activeSubjectBtn ? activeSubjectBtn.textContent : 'Subject';
    
    
    const videosList = document.createElement('div');
    videosList.className = 'videos-list';
    
    
    const subjectTitle = document.createElement('h3');
    subjectTitle.className = 'subject-title';
    subjectTitle.textContent = subjectName;
    videosList.appendChild(subjectTitle);
    
    
    const videosGrid = document.createElement('div');
    videosGrid.className = 'videos-grid';
    
    
    Object.keys(videos).forEach(key => {
        
        const sanitizedVideo = sanitizeVideoData(videos[key]);
        const videoCard = createVideoCard(sanitizedVideo);
        videosGrid.appendChild(videoCard);
    });
    
    
    videosList.appendChild(videosGrid);
    
    
    const existingVideosList = document.querySelector('.videos-section .videos-list');
    if (existingVideosList) {
        existingVideosList.remove();
    }
    
    
    videosContainer.appendChild(videosList);
    
    
    if (window.applyContentLoadedAnimation) {
        window.applyContentLoadedAnimation(videosContainer);
    }
}


function displayVideoEmptyState(message = 'There are no videos available for this semester yet.') {
    if (!videosContainer) return;
    
    
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
        
        videosContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <p>${message}</p>
            </div>
        `;
    }
}


function displayVideoError() {
    if (!videosContainer) return;
    
    videosContainer.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load videos. Please try again later.</p>
        </div>
    `;
}


function handleVideoSemesterChange(event) {
    const semester = event.target.dataset.sem;
    
    
    videoSemesterTabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    
    currentVideoSemester = semester;
    loadVideos(semester);
}


function handleVideoSubjectClick(event) {
    const subject = event.target.dataset.subject;
    const subjectName = event.target.textContent || 'Subject';
    
    
    const subjectBtns = document.querySelectorAll('.videos-section .subject-btn');
    subjectBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    
    const backButton = document.querySelector('.videos-section .back-button');
    if (backButton) backButton.classList.remove('hidden');
    
    
    loadVideos(currentVideoSemester, subject);
}
