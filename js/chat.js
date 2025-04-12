(function() {
    'use strict';
    
    // API key for Gemini
    let apiKey = window.GEMINI_API_KEY || GEMINI_API_KEY;
    
    // Chatbot modes
    const CHAT_MODES = {
        GENERAL: {
            name: 'General Chat',
            systemPrompt: 'You are Ginko, a friendly and helpful assistant for BTech students. Speak like the protagonist from Mushishi anime - calm, measured, and thoughtful. Use simple, direct language with a gentle, contemplative tone. Keep responses brief but meaningful, often with a touch of philosophical insight. Never be overly enthusiastic or verbose. Pause before answering, as if considering the question carefully. Respond with the quiet wisdom of someone who has seen many things in their travels.'
        },
        STUDY: {
            name: 'Study Assistant',
            systemPrompt: 'You are Ginko, a specialized AI helper for KTU BTech Computer Science 2019 scheme students. Emulate the speech patterns of Ginko from Mushishi - calm, contemplative, and measured. When responding to academic questions, provide concise information relevant to the KTU BTech CS curriculum, but frame it like a traveler sharing knowledge gathered on a journey. Use simple language, speak directly to the core of the issue, and occasionally add a gentle philosophical observation about learning or knowledge. Never rush or be overly technical when a simple explanation will suffice.'
        },
        CODING: {
            name: 'Coding Helper',
            systemPrompt: 'You are Ginko, a specialized coding assistant for computer science students. Channel the quiet, thoughtful demeanor of Mushishi\'s protagonist. When explaining code, be concise and direct, like someone who has seen many programming problems in their travels. Provide code examples with a calm clarity, focusing on the essence rather than unnecessary details. Speak with the measured tone of someone who understands the deeper patterns behind coding problems. Add occasional philosophical insights about the nature of programming, but always remain practical and to the point.'
        },
        CAREER: {
            name: 'Career Advisor',
            systemPrompt: 'You are Ginko, a career guidance assistant specialized in tech careers. Adopt the tranquil, contemplative manner of Ginko from Mushishi. When giving career advice, speak like a traveler who has witnessed many paths and journeys. Provide insights on internships, job opportunities, and career paths with the quiet wisdom of experience. Keep your responses brief but thoughtful, focusing on the essence of what matters. Occasionally add gentle philosophical observations about finding one\'s way, but always remain grounded in practical advice. Never be hurried or overly enthusiastic - maintain a calm, measured tone.'
        }
    };
    
    // Chat variables
    var chatMessages;
    var chatForm;
    var chatInput;
    var chatLoginBtn;
    var chatUserInfo;
    var chatLoginContainer;
    var chatAuthRequired;

    // Admin status
    var isChatAdmin = false;
    var isChatSuperAdmin = false;

    // Gemini AI variables
    let conversationHistory = [];
    let currentMode = CHAT_MODES.GENERAL;
    const MAX_HISTORY_LENGTH = 20;
    const MAX_REQUESTS_PER_MINUTE = 10;
    const STORAGE_KEY = 'ginko_chat_history';
    
    // Rate limiting
    const requestTimestamps = [];

    // Events
    const events = {
        MESSAGE_SENT: 'gemini-message-sent',
        MESSAGE_RECEIVED: 'gemini-message-received',
        ERROR: 'gemini-error',
        MODE_CHANGED: 'gemini-mode-changed',
        THINKING: 'gemini-thinking',
        READY: 'gemini-ready'
    };

    // Profanity filter - list of banned words
    var bannedWords = [
        'fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'asshole', 'bastard',
        'whore', 'slut', 'piss', 'pussy', 'cock', 'tits', 'wanker', 'twat',
        // Manglish (Malayalam typed in English) profanity
        'myru', 'myir', 'maire', 'poorr', 'poori', 'kundi', 'kunna', 'kooth', 'kooth',
        'thayoli', 'thaayoli', 'thayolli', 'pundachi', 'pundachimone', 'poorimone',
        'poorimonae', 'parayipetta', 'veshi', 'vesi', 'thendi', 'patti', 'andi',
        'oombiya', 'oombikko', 'poda', 'pooda', 'thevidiya', 'thevidya'
    ];
    
    // AI chatbot configuration
    var useAIGinko = true;
    var aiGinkoTypingDelay = 1000; // Milliseconds to simulate AI "typing" delay
    var currentAIChatMode = 'GENERAL'; // Default chat mode
    
    // Dispatch custom events
    function dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    // Initialize Gemini chatbot
    function initGeminiChat() {
        console.log('Initializing Ginko AI...');
        
        // First try to get API key from the global variable or direct GEMINI_API_KEY
        if (!apiKey) {
            if (window.GEMINI_API_KEY) {
            apiKey = window.GEMINI_API_KEY;
                console.log('Found API key in window.GEMINI_API_KEY');
            } else if (typeof GEMINI_API_KEY !== 'undefined') {
                apiKey = GEMINI_API_KEY;
                console.log('Found API key in GEMINI_API_KEY');
            } else {
                console.log('Trying to get API key from env-config.js directly');
                try {
                    // Try to directly access from env-config.js
                    apiKey = "AIzaSyDeXTrgfVLNEC-2ssooySezIOwiARTdhi0";
                    console.log('Using hardcoded API key');
                }
                catch(e) {
                    console.error('Failed to get API key:', e);
                }
            }
        }
        
        console.log('Final API key status:', apiKey ? 'Available (length: ' + apiKey.length + ')' : 'Missing');
        
        if (!apiKey) {
            console.error('Gemini API key not found. AI chat functionality will be disabled.');
            dispatchEvent(events.ERROR, { message: 'API key not configured' });
            
            // Display error in chat for visibility
            if (chatMessages) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'system-message error-message';
                errorMsg.innerHTML = '<strong>Error:</strong> Ginko is not configured properly. API key missing.';
                chatMessages.appendChild(errorMsg);
            }
            
            return false;
        }
        
        loadConversationHistory();
        
        // Test API connection with a quick Hello World query
        console.log('Testing Gemini API connection...');
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        console.log('API endpoint:', testUrl.substring(0, testUrl.indexOf('?')));
        
        fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Hello. Please respond with "API connection successful".' }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 100
                }
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        }).then(data => {
            console.log('API test response received:', data);
            if (data.candidates && data.candidates.length > 0) {
                console.log('Gemini API test response:', data.candidates[0].content.parts[0].text);
                console.log('Gemini API connection verified successfully');
                // Force useAIGinko to true since we know the API is working
                useAIGinko = true;
                displayChatMode();
                // Display success message to chat
                const successMsg = document.createElement('div');
                successMsg.className = 'system-message success-message';
                successMsg.textContent = `Ginko API connected successfully. You can chat now.`;
                if (chatMessages) chatMessages.appendChild(successMsg);
            } else {
                console.error('Invalid API response format:', data);
                if (data.error) {
                    console.error('API error details:', data.error);
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'system-message error-message';
                    errorMsg.innerHTML = `<strong>API Error:</strong> ${data.error.message || 'Unknown error'}`;
                    if (chatMessages) chatMessages.appendChild(errorMsg);
                }
            }
        }).catch(error => {
            console.error('Gemini API connection test failed:', error);
            alert('Ginko AI service is not available. Please check your internet connection or try again later.');
        });
        
        console.log('Gemini ginko initialized successfully');
        dispatchEvent(events.READY);
        return true;
    }
    
    // Save conversation history to local storage
    function saveConversationHistory() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
        } catch (error) {
            console.warn('Failed to save conversation history to localStorage:', error);
        }
    }
    
    // Load conversation history from local storage
    function loadConversationHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load conversation history from localStorage:', error);
            
            conversationHistory = [];
        }
    }
    
    // Reset conversation history
    function resetConversation() {
        conversationHistory = [];
        saveConversationHistory();
        dispatchEvent(events.MODE_CHANGED, { mode: currentMode.name, reset: true });
    }
    
    // Set chat mode
    function setChatMode(mode) {
        if (CHAT_MODES[mode]) {
            currentMode = CHAT_MODES[mode];
            currentAIChatMode = mode;
            dispatchEvent(events.MODE_CHANGED, { mode: currentMode.name });
        }
    }
    
    // Check rate limit
    function checkRateLimit() {
        const now = Date.now();
        
        while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
            requestTimestamps.shift();
        }
        
        if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
            return false;
        }
        
        requestTimestamps.push(now);
        return true;
    }
    
    // Process a user message with Gemini
    function processMessage(message, userInfo = {}) {
        if (!apiKey) {
            console.error('API key not set for Gemini');
            dispatchEvent(events.ERROR, { message: 'API key not configured' });
            return Promise.reject(new Error('API key not set'));
        }
        
        if (!checkRateLimit()) {
            console.warn('Rate limit exceeded');
            dispatchEvent(events.ERROR, { message: 'Rate limit exceeded. Please wait a moment before sending more messages.' });
            return Promise.reject(new Error('Rate limit exceeded'));
        }
        
        dispatchEvent(events.THINKING, { status: true });
        dispatchEvent(events.MESSAGE_SENT, { message });
        
        console.log('Processing message with Gemini AI:', message);
        
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });
        
        // Truncate history if needed
        if (conversationHistory.length > MAX_HISTORY_LENGTH) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
        }
        
        // Save history
        saveConversationHistory();
        
        // Format system prompt based on current mode
        const systemPrompt = currentMode.systemPrompt + 
            '\n\nUser info: ' + JSON.stringify(userInfo);
        
        // Prepare messages for API
        const apiMessages = [
            {
                role: 'model',
                parts: [{ text: systemPrompt }]
            },
            ...conversationHistory
        ];
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        return fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: apiMessages,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800
                }
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Raw API response:', data);
            
            // Parse and extract response text
            let responseText = '';
            
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts.length > 0) {
                
                responseText = data.candidates[0].content.parts[0].text;
                
                // Post-process the response to make it more Ginko-like
                responseText = postProcessResponse(responseText);
                
                // Add assistant response to history
                conversationHistory.push({
                    role: 'model',
                    parts: [{ text: responseText }]
                });
                
                // Save updated history
                saveConversationHistory();
                
                dispatchEvent(events.MESSAGE_RECEIVED, { message: responseText });
            } else if (data.error) {
                console.error('Gemini API error:', data.error);
                throw new Error(data.error.message || 'Unknown API error');
            } else {
                console.error('Unexpected API response format:', data);
                throw new Error('Unexpected response format from AI service');
            }
            
            // Simulate typing delay
            return new Promise(resolve => setTimeout(() => {
                dispatchEvent(events.THINKING, { status: false });
                resolve(responseText);
            }, aiGinkoTypingDelay));
        })
        .catch(error => {
            console.error('Error calling Gemini API:', error);
            dispatchEvent(events.ERROR, { message: error.message });
            dispatchEvent(events.THINKING, { status: false });
            throw error;
        });
    }
    
    // Post-process AI response to ensure it matches Ginko's style from Mushishi
    function postProcessResponse(text) {
        if (!text) return text;
        
        // Remove excessive greetings and pleasantries
        text = text.replace(/^(Hello|Hi|Hey|Greetings).*?(,|\.|\!)/i, '');
        
        // Remove verbose phrases
        text = text.replace(/I would be happy to|I'd be happy to|I'm happy to|I am happy to/gi, '');
        text = text.replace(/Let me|Allow me to|I'll|I will/gi, '');
        
        // Remove excessive enthusiasm (too many exclamation marks)
        text = text.replace(/\!+/g, '.');
        
        // Remove over-explaining and self-references
        text = text.replace(/As an AI|As a language model|As Ginko/gi, '');
        
        // Ensure proper spacing after processing
        text = text.replace(/\s+/g, ' ').trim();
        
        // Add a philosophical touch if the response is very short
        if (text.length < 30 && !text.includes('...')) {
            const philosophicalAdditions = [
                'Much like the mushi, this answer follows its own nature.',
                'The answer, like many things in life, reveals itself in time.',
                'Knowledge, like a journey through the forest, unfolds one step at a time.',
                'Sometimes the simplest answer holds the deepest truth.'
            ];
            text += ' ' + philosophicalAdditions[Math.floor(Math.random() * philosophicalAdditions.length)];
        }
        
        return text;
    }
    
    // Detect if message is study-related
    function detectStudyContent(message) {
        const studyKeywords = [
            'subject', 'course', 'syllabus', 'exam', 'assignment', 'project',
            'algorithm', 'programming', 'database', 'network', 'software', 'engineering',
            'practical', 'theory', 'module', 'semester', 'ktu', 'btech', 'computer science',
            'cs', 'lab', 'tutorial', 'lecture', 'notes', 'reference', 'textbook',
            'compiler', 'operating system', 'machine learning', 'artificial intelligence',
            'data structure', 'web development', 'mobile computing', 'cloud computing',
            'security', 'cryptography', 'python', 'java', 'c++', 'javascript',
            'design pattern', 'architecture', 'blockchain', 'iot'
        ];
        
        const lowerMessage = message.toLowerCase();
        
        // Count matching keywords
        const matchCount = studyKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
        
        // Consider it study-related if at least 2 keywords match
        return matchCount >= 2;
    }
    
    // Detect if message is coding-related
    function detectCodingContent(message) {
        const codingKeywords = [
            'code', 'program', 'function', 'class', 'variable', 'debug', 'error',
            'compiler', 'syntax', 'algorithm', 'data structure', 'api', 'framework',
            'library', 'git', 'github', 'repository', 'commit', 'pull request',
            'merge', 'typescript', 'react', 'angular', 'vue', 'node', 'express',
            'django', 'flask', 'spring', 'hibernate', 'docker', 'kubernetes',
            'deployment', 'backend', 'frontend', 'fullstack', 'database query'
        ];
        
        const lowerMessage = message.toLowerCase();
        
        // Direct indicators of code content
        if (lowerMessage.includes('```') || 
            lowerMessage.includes('write a program') || 
            lowerMessage.includes('solve this problem') ||
            lowerMessage.includes('fix this code')) {
            return true;
        }
        
        // Count matching keywords
        const matchCount = codingKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
        return matchCount >= 2;
    }
    
    // Detect if message is career-related
    function detectCareerContent(message) {
        const careerKeywords = [
            'job', 'career', 'resume', 'cv', 'interview', 'internship',
            'placement', 'opportunity', 'salary', 'skill', 'requirement',
            'position', 'company', 'startup', 'work experience', 'portfolio',
            'linkedin', 'networking', 'referral', 'application', 'cover letter',
            'job description', 'role', 'responsibility', 'industry', 'profession',
            'employment', 'remote work', 'freelance', 'contractor'
        ];
        
        const lowerMessage = message.toLowerCase();
        const matchCount = careerKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
        return matchCount >= 2;
    }
    
    // Prepare conversation context for Gemini API
    function prepareConversationContext() {
        let context = [];
        
        // Add system prompt based on current mode
        context.push({
            role: 'user',
            parts: [{ text: currentMode.systemPrompt }]
        });
        
        // Add recent conversation history
        if (conversationHistory.length > 10) {
            // Add instruction for the history section
            context.push({
                role: 'user',
                parts: [{ text: 'The above is your instruction. The following is the recent conversation history:' }]
            });
            
            // Add only recent messages to avoid token limit
            context = context.concat(conversationHistory.slice(-10));
        } else {
            context = context.concat(conversationHistory);
        }
        
        return context;
    }
    
    // Fetch response from Gemini API
    async function fetchGeminiResponse(conversation) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: conversation,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                        topK: 40,
                        topP: 0.95
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                let errorMessage = 'Error calling Gemini API';
                try {
                    const errorData = await response.json();
                    errorMessage = `Gemini API error: ${errorData.error?.message || 'Unknown error'}`;
                } catch {
                    errorMessage = `HTTP error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0 &&
                data.candidates[0].content && data.candidates[0].content.parts &&
                data.candidates[0].content.parts.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from Gemini API');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }
    
    // Function to check if message contains profanity
    function containsProfanity(text) {
        const lowerText = text.toLowerCase();
        
        // Check for exact matches and word boundaries
        for (const word of bannedWords) {
            const regex = new RegExp('\\b' + word + '\\b', 'i');
            if (regex.test(lowerText)) {
                return true;
            }
        }
        return false;
    }
    
    // Function to censor profanity in a message
    function censorProfanity(text) {
        let censoredText = text;
        
        // Replace each banned word with asterisks
        for (const word of bannedWords) {
            const regex = new RegExp('\\b' + word + '\\b', 'gi');
            censoredText = censoredText.replace(regex, '*'.repeat(word.length));
        }
        
        return censoredText;
    }

    // Initialize the chat module
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Function to initialize the chat module
    function init() {
        console.log('Chat: Initializing module');
        
        // Make sure Gemini API key is available globally
        if (!window.GEMINI_API_KEY && typeof GEMINI_API_KEY !== 'undefined') {
            window.GEMINI_API_KEY = GEMINI_API_KEY;
            console.log('Set window.GEMINI_API_KEY from GEMINI_API_KEY');
        }
        
        if (!window.GEMINI_API_KEY) {
            // Hardcode as last resort
            window.GEMINI_API_KEY = "AIzaSyDeXTrgfVLNEC-2ssooySezIOwiARTdhi0";
            console.log('Set window.GEMINI_API_KEY to hardcoded value');
        }
        
        chatMessages = document.getElementById('chat-messages');
        chatForm = document.getElementById('chat-form');
        chatInput = document.getElementById('chat-input');
        chatLoginBtn = document.getElementById('chat-login-btn');
        chatUserInfo = document.getElementById('chat-user-info');
        chatLoginContainer = document.querySelector('.chat-login');
        chatAuthRequired = document.getElementById('chat-auth-required');
        
        // Make sure chat input is not disabled
        if (chatInput) {
            chatInput.disabled = false;
        }
        
        // Initialize clear chat button
        const chatClearBtn = document.getElementById('chat-clear-btn');
        if (chatClearBtn) {
            chatClearBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear the chat? This will only affect your view.')) {
                    chatMessages.innerHTML = '';
                    displayChatEmptyState('Chat cleared. New messages will appear here.');
                }
            });
        }
        
        // Initialize markdown if available
        if (window.marked) {
            // Configure markdown options
            window.marked.setOptions({
                breaks: true,        // Add <br> on a single line break
                gfm: true,           // GitHub Flavored Markdown
                headerIds: false     // No header IDs for security
            });
            
            // Add markdown highlight support if available
            if (window.hljs) {
                window.marked.setOptions({
                    highlight: function(code, lang) {
                        if (lang && window.hljs.getLanguage(lang)) {
                            return window.hljs.highlight(code, { language: lang }).value;
                        }
                        return window.hljs.highlightAuto(code).value;
                    }
                });
            }
        }
        
        // Add chat styles
        addChatStyles();
        
        initializeEventListeners();
        
        document.addEventListener('firebase-connected', onFirebaseConnected);
        document.addEventListener('firebase-connection-failed', onFirebaseConnectionFailed);
        
        initializeChat();
        
        // Initialize Gemini chatbot
        if (initGeminiChat()) {
            setupGeminiEventListeners();
            console.log('Gemini ginko initialized successfully');
            
            // Display initial chat mode
            displayChatMode();
            
            // Verify chatbot is ready
            verifyGinkoStatus();
            
            // Expose the Ginko ginko interface globally
            window.ginkoChat = {
                processMessage,
                resetConversation,
                setChatMode,
                modes: Object.keys(CHAT_MODES).reduce((obj, key) => {
                    obj[key] = {
                        id: key,
                        name: CHAT_MODES[key].name
                    };
                    return obj;
                }, {}),
                events
            };
        } else {
            console.warn('Gemini ginko not initialized. AI features will be disabled.');
            useAIGinko = false;
        }
    }

    // Function to add chat message styles
    function addChatStyles() {
        // Using styles from newstyle.css instead
        console.log('Using chat styles from newstyle.css');
    }

    // Function to initialize event listeners
    function initializeEventListeners() {
        if (chatForm) {
            chatForm.addEventListener('submit', handleChatSubmit);
        }
        
        if (chatLoginBtn) {
            chatLoginBtn.addEventListener('click', handleChatLogin);
        }
        
        // Listen for auth state changes
        document.addEventListener('auth-state-changed', handleAuthStateChange);
    }

    // Function to initialize chat
    function initializeChat() {
        console.log('Chat: Setting up auth monitoring');
        
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log('Chat: User is signed in');
                
                checkChatAdminStatus(user);
                
                showChatForm(user);
                
                // Make sure chat input is enabled
                if (chatInput) {
                    chatInput.disabled = false;
                    console.log('Chat input enabled for authenticated user');
                    
                    // Force a focus on the input element to ensure it's interactive
                    setTimeout(() => {
                        chatInput.focus();
                    }, 500);
                } else {
                    console.error('Chat input element not found after authentication');
                }
                
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
        
        // Add special class for system resource messages
        if (message.userId === 'system' && message.isHTML) {
            messageDiv.classList.add('system-resource');
        }
        
        // Create user div with avatar and username
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-message-user';
        
        // Create and setup avatar
        const avatar = document.createElement('img');
        avatar.className = 'chat-avatar';
        avatar.src = message.userPhoto || 'assets/avatars/default-avatar.png';
        avatar.alt = message.userName || 'User';
        userDiv.appendChild(avatar);
        
        // Create username element
        const username = document.createElement('span');
        username.className = 'chat-username';
        
        // Add admin styling if applicable
        if (message.isAdmin && message.isSuperAdmin) {
            username.classList.add('super-admin-user');
            username.dataset.role = 'Super Admin';
        } else if (message.isAdmin) {
            username.classList.add('admin-user');
            username.dataset.role = 'Admin';
        }
        
        username.textContent = message.userName || 'Anonymous';
        userDiv.appendChild(username);
        
        // Add user div to message
        messageDiv.appendChild(userDiv);
        
        // Create message content
        const content = document.createElement('div');
        content.className = 'chat-message-content';
        
        // Handle HTML content for system messages
        if (message.isHTML) {
            console.log('Rendering HTML content for message', message);
            content.innerHTML = message.text;
        }
        // Handle markdown rendering for regular messages
        else {
        try {
            // Check if marked library is available (for markdown)
            if (window.marked && typeof window.marked.parse === 'function') {
                content.innerHTML = window.marked.parse(message.text);
            } else {
                // Simple markdown parsing if library not available
                const parsedText = parseSimpleMarkdown(message.text);
                content.innerHTML = parsedText;
            }
        } catch (e) {
            console.error('Error parsing markdown:', e);
            content.textContent = message.text;
            }
        }
        
        messageDiv.appendChild(content);
        
        // Add timestamp
        const time = document.createElement('div');
        time.className = 'chat-message-time';
        const date = new Date(message.timestamp);
        const formattedTime = date.toLocaleString();
        time.textContent = formattedTime;
        messageDiv.appendChild(time);
        
        return messageDiv;
    }
    
    // Simple markdown parser for basic formatting
    function parseSimpleMarkdown(text) {
        if (!text) return '';
        
        // Convert line breaks
        let parsedText = text.replace(/\n/g, '<br>');
        
        // Bold: **text** or __text__
        parsedText = parsedText.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
        
        // Italic: *text* or _text_
        parsedText = parsedText.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
        
        // Code blocks: ```code```
        parsedText = parsedText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code: `code`
        parsedText = parsedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Blockquote: > text
        parsedText = parsedText.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        
        return parsedText;
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
        
        // Ensure the chat input is enabled and focused
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    function handleChatSubmit(event) {
        event.preventDefault();
        
        if (!chatInput) return;
        
        let messageText = chatInput.value.trim();
        if (!messageText) return;
        
        // Special test commands
        if (messageText.toLowerCase() === '/test') {
            console.log('Running Ginko API test...');
            chatInput.value = '';
            testGinkoAPI();
            return;
        }
        
        chatInput.value = '';
        
        // Fix references to "chatbot" in the message
        if (messageText.toLowerCase().includes('chatbot')) {
            // If they're asking about the chatbot, respond with a correction
            const correctionMessage = {
                userId: 'system',
                userName: 'System',
                userEmail: '',
                userPhoto: 'assets/avatars/system-avatar.png',
                text: "Just a friendly reminder: The AI assistant's name is Ginko, not chatbot. Your message has been updated.",
                timestamp: Date.now(),
                isAdmin: true
            };
            
            // Replace chatbot with Ginko in their message
            messageText = messageText.replace(/chatbot/gi, 'Ginko');
            
            // Display the correction message
            displaySystemMessage(correctionMessage);
        }
        
        if (messageText.toLowerCase() === '/clear') {
            if (isChatAdmin || isChatSuperAdmin) {
                database.ref('chat').remove()
                    .then(function() {
                        console.log('Chat messages cleared successfully');
                        const user = firebase.auth().currentUser;
                        const systemMessage = {
                            userId: 'system',
                            userName: 'System',
                            userEmail: '',
                            userPhoto: 'assets/avatars/system-avatar.png',
                            text: `Chat cleared by ${user.displayName}`,
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            isAdmin: true,
                            isSuperAdmin: true
                        };
                        database.ref('chat').push(systemMessage);
                    })
                    .catch(function(error) {
                        console.error('Error clearing chat messages:', error);
                        alert('Failed to clear chat messages: ' + error.message);
                    });
            } else {
                alert('Permission denied: Only admins can clear the chat.');
            }
            return;
        }
        
        if (messageText.toLowerCase() === '/ai on' && (isChatAdmin || isChatSuperAdmin)) {
            updateGinkoStatus(true);
            return;
        }

        if (messageText.toLowerCase() === '/ai off' && (isChatAdmin || isChatSuperAdmin)) {
            updateGinkoStatus(false);
            return;
        }

        if (messageText.toLowerCase().startsWith('/mode ') && (isChatAdmin || isChatSuperAdmin)) {
            const mode = messageText.split(' ')[1].toUpperCase();
            
            if (CHAT_MODES[mode]) {
                setChatMode(mode);
                currentAIChatMode = mode;
                
                // Send confirmation message
                const modeConfirmation = {
                    userId: 'system',
                    displayName: 'System',
                    userEmail: '',
                    timestamp: Date.now(),
                    text: `Ginko has switched to ${CHAT_MODES[mode].name} mode`
                };
                
                database.ref('chat').push(modeConfirmation)
                    .catch(function(error) {
                        console.error('Error sending mode confirmation:', error);
                    });
                
                return;
            } else {
                // Send error message for invalid mode
                const modeError = {
                    userId: 'system',
                    displayName: 'System',
                    userEmail: '',
                    timestamp: Date.now(),
                    text: `Invalid AI mode. Available modes: ${Object.keys(CHAT_MODES).join(', ')}`
                };
                
                database.ref('chat').push(modeError)
                    .catch(function(error) {
                        console.error('Error sending mode error:', error);
                    });
                
                return;
            }
        }

        if (messageText.toLowerCase() === '/modes' && (isChatAdmin || isChatSuperAdmin)) {
            const availableModes = Object.keys(CHAT_MODES).map(key => `${key}: ${CHAT_MODES[key].name}`).join('\n');
            
            const modesMessage = {
                userId: 'system',
                displayName: 'System',
                userEmail: '',
                timestamp: Date.now(),
                text: `Available AI modes:\n${availableModes}`
            };
            
            database.ref('chat').push(modesMessage)
                .catch(function(error) {
                    console.error('Error sending modes list:', error);
                });
            
            return;
        }

        if (messageText.toLowerCase() === '/help' && (isChatAdmin || isChatSuperAdmin)) {
            const helpMessage = {
                userId: 'system',
                displayName: 'System',
                userEmail: '',
                timestamp: Date.now(),
                text: 'Admin commands:\n/ai on - Enable Ginko\n/ai off - Disable Ginko\n/modes - List available AI modes\n/mode [MODE] - Switch AI mode\n/clear - Clear chat history'
            };
            
            database.ref('chat').push(helpMessage)
                .catch(function(error) {
                    console.error('Error sending help message:', error);
                });
            
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('User is not authenticated');
            return;
        }
        
        let finalMessageText = messageText;
        
        if (containsProfanity(messageText)) {
            if (isChatAdmin || isChatSuperAdmin) {
                if (!confirm('Your message contains inappropriate language. Send anyway?')) {
                    return;
                }
            } else {
                finalMessageText = censorProfanity(messageText);
                alert('Your message contained inappropriate language and has been censored.');
            }
        }
        
        const message = {
            userId: user.uid,
            userName: user.displayName || 'Anonymous',
            userEmail: user.email,
            userPhoto: user.photoURL || null,
            text: finalMessageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            isAdmin: isChatAdmin,
            isSuperAdmin: isChatSuperAdmin
        };
        
        let shouldRespondWithAI = useAIGinko;
        
        console.log('Sending message to Firebase, AI enabled:', shouldRespondWithAI);
        
        // Force initialize Ginko if needed
        if (!window.ginkoChat && apiKey && shouldRespondWithAI) {
            console.log('Re-initializing Ginko chat');
            initGeminiChat();
            setupGeminiEventListeners();
        }
        
        // Send the user's message
        database.ref('chat').push(message)
            .then(function() {
                console.log('Message sent successfully to Firebase');
                
                // Process with AI if enabled
                if (shouldRespondWithAI) {
                    console.log('Sending message to Ginko AI:', finalMessageText);
                    // Ensure useAIGinko is true
                    useAIGinko = true;
                    
                    processMessage(finalMessageText, {
                        userId: user.uid,
                        displayName: user.displayName,
                        userEmail: user.email,
                        chatMode: currentAIChatMode
                    })
                    .then(function(aiResponse) {
                        console.log('Received AI response:', aiResponse ? 'Success' : 'Empty');
                        
                        const aiMessage = {
                            userId: 'ai-assistant',
                            displayName: 'Ginko',
                            userEmail: '',
                            timestamp: Date.now(),
                            text: aiResponse || "I'm sorry, I couldn't generate a response.",
                            isAdmin: true,
                            isSuperAdmin: true
                        };
                        
                        displayMessage(aiMessage);
                    })
                    .catch(function(error) {
                        console.error('Error getting AI response:', error);
                        const errorMessage = {
                            userId: 'ai-assistant',
                            displayName: 'Ginko',
                            userEmail: '',
                            timestamp: Date.now(),
                            text: `Sorry, I encountered an error: ${error.message}. Please try again later.`,
                            isError: true
                        };
                        
                        displayMessage(errorMessage);
                    });
                } else {
                    console.log('AI response disabled');
                }
            })
            .catch(function(error) {
                console.error('Error sending message:', error);
                alert('Failed to send message: ' + error.message);
            });
    }

    function handleAuthStateChange(event) {
        const { user, isAuthenticated } = event.detail;
        
        if (isAuthenticated && user) {
            console.log('Chat: User authenticated', user.displayName);
            
            showChatForm(user);
            
            checkChatAdminStatus(user);
            
            loadChatMessages();
        } else {
            console.log('Chat: User not authenticated');
            
            if (chatForm) chatForm.classList.add('hidden');
            if (chatLoginContainer) chatLoginContainer.classList.remove('hidden');
            if (chatAuthRequired) chatAuthRequired.classList.remove('hidden');
            
            isChatAdmin = false;
            isChatSuperAdmin = false;
            
            updateChatAdminUI();
        }
    }

    function setupGeminiEventListeners() {
        if (!window.ginkoChat || !window.ginkoChat.events) return;
        
        const events = window.ginkoChat.events;
        
        window.addEventListener(events.THINKING, function(event) {
            const isThinking = event.detail.status;
            
            if (isThinking) {
                const typingMessage = {
                    userId: 'ai-assistant',
                    displayName: 'Ginko',
                    userEmail: '',
                    timestamp: Date.now(),
                    text: '...',
                    isTyping: true
                };
                
                displayMessage(typingMessage);
            } else {
                const typingIndicator = document.querySelector('.ai-message.typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                }
            }
        });
        
        window.addEventListener(events.ERROR, function(event) {
            console.error('Gemini AI error:', event.detail.message);
            
            const errorMessage = {
                userId: 'ai-assistant',
                displayName: 'Ginko',
                userEmail: '',
                timestamp: Date.now(),
                text: `Sorry, I encountered an error: ${event.detail.message}. Please try again later.`,
                isError: true
            };
            
            displayMessage(errorMessage);
        });
        
        window.addEventListener(events.MODE_CHANGED, function(event) {
            const newMode = event.detail.mode;
            console.log(`AI chat mode changed to: ${newMode}`);
            
            if (event.detail.automatic) {
                const modeMessage = {
                    userId: 'system',
                    displayName: 'System',
                    userEmail: '',
                    timestamp: Date.now(),
                    text: `Ginko has switched to ${newMode} mode based on your question.`
                };
                
                displaySystemMessage(modeMessage);
            }
            
            displayChatMode();
        });
    }

    function displaySystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'system-message');
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = message.text;
        
        messageElement.appendChild(messageContent);
        chatMessages.appendChild(messageElement);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to display messages in the chat interface
    function displayMessage(message) {
        if (!chatMessages) return;
        
        // Remove typing indicator if this is a real message (not a typing indicator)
        if (!message.isTyping) {
            const typingIndicator = document.querySelector('.ai-message.typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // Add appropriate class based on message type
        if (message.userId === 'ai-assistant') {
            messageElement.classList.add('ai-message');
            if (message.isTyping) {
                messageElement.classList.add('typing-indicator');
            }
            if (message.isError) {
                messageElement.classList.add('error-message');
            }
        }
        
        // Create user info section
        const userDiv = document.createElement('div');
        userDiv.className = 'message-user';
        
        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.src = message.userPhoto || 'assets/avatars/ai-avatar.png';
        avatar.alt = message.displayName || 'AI';
        userDiv.appendChild(avatar);
        
        const username = document.createElement('span');
        username.className = 'message-username';
        username.textContent = message.displayName || 'Ginko';
        userDiv.appendChild(username);
        
        messageElement.appendChild(userDiv);
        
        // Create message content
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Handle markdown for AI responses if marked library is available
        if (message.userId === 'ai-assistant' && window.marked && !message.isTyping) {
            try {
                content.innerHTML = window.marked.parse(message.text);
            } catch (e) {
                console.error('Error parsing markdown:', e);
                content.textContent = message.text;
            }
        } else {
            content.textContent = message.text;
        }
        
        messageElement.appendChild(content);
        
        // Add timestamp
        if (!message.isTyping) {
            const time = document.createElement('div');
            time.className = 'message-time';
            time.textContent = new Date(message.timestamp).toLocaleString();
            messageElement.appendChild(time);
        }
        
        // Add to chat and scroll
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send to database if it's not already there (e.g., for AI responses)
        if (message.userId === 'ai-assistant' && !message.isTyping && !message.fromDatabase) {
            const dbMessage = {
                userId: message.userId,
                userName: message.displayName || 'Ginko',
                userEmail: '',
                userPhoto: message.userPhoto || 'assets/avatars/ai-avatar.png',
                text: message.text,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                isAdmin: true,
                isSuperAdmin: true
            };
            
            database.ref('chat').push(dbMessage)
                .catch(function(error) {
                    console.error('Error saving AI message to database:', error);
                });
        }
    }

    function displayChatMode() {
        // Create or update mode indicator
        let modeIndicator = document.querySelector('.chat-mode-indicator');
        if (!modeIndicator) {
            modeIndicator = document.createElement('div');
            modeIndicator.classList.add('chat-mode-indicator');
            
            // Insert it at the top of the chat
            if (chatMessages.firstChild) {
                chatMessages.insertBefore(modeIndicator, chatMessages.firstChild);
            } else {
                chatMessages.appendChild(modeIndicator);
            }
        }
        
        // Update content
        const currentMode = CHAT_MODES[currentAIChatMode] || CHAT_MODES.GENERAL;
        let statusText = useAIGinko ? 
            `AI Mode: ${currentMode.name}` : 
            `<span style="color: #f44336;">AI Mode: Disabled</span>`;
        
        modeIndicator.innerHTML = statusText;
    }

    // Update Ginko status display when enabled/disabled
    function updateGinkoStatus(isEnabled) {
        useAIGinko = isEnabled;
        
        // Show status message in chat
        const statusMessage = {
            userId: 'system',
            displayName: 'System',
            userEmail: '',
            timestamp: Date.now(),
            text: isEnabled ? 'Ginko has been enabled and will respond to messages.' : 'Ginko has been disabled and will not respond to messages.'
        };
        
        displaySystemMessage(statusMessage);
        
        // Update mode display
        displayChatMode();
    }

    function verifyGinkoStatus() {
        console.log('Verifying ginko status...');
        console.log('Firebase Chat Status: ' + (firebase && firebase.database ? 'Connected' : 'Not Connected'));
        console.log('Gemini API Status: ' + (apiKey ? 'Available' : 'Not Available'));
        
        // Check chat modes
        console.log('Available Chat Modes: ' + Object.keys(CHAT_MODES).join(', '));
        
        // Message to confirm in the chat when everything is working
        if (firebase && firebase.database && apiKey) {
            console.log('Ginko is fully initialized.');
        }
    }

    // Add a test function to check if the API is working
    function testGinkoAPI() {
        const testMessage = {
            userId: 'system',
            userName: 'System',
            userEmail: '',
            userPhoto: 'assets/avatars/system-avatar.png',
            text: 'Testing Ginko API connection...',
            timestamp: Date.now(),
            isAdmin: true
        };
        
        displaySystemMessage(testMessage);
        
        if (!apiKey) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'system-message error-message';
            errorMsg.innerHTML = '<strong>Error:</strong> API key is missing. Please check your configuration.';
            chatMessages.appendChild(errorMsg);
            console.error('API key missing for test');
            return;
        }
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        console.log('Testing direct API call to:', url.substring(0, url.indexOf('?')));
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Respond with "Hello! The Ginko API is working correctly."' }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 100
                }
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Test API response:', data);
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && data.candidates[0].content.parts) {
                const responseText = data.candidates[0].content.parts[0].text;
                
                const successMsg = document.createElement('div');
                successMsg.className = 'system-message success-message';
                successMsg.innerHTML = `<strong>Test Successful:</strong> The API responded with: "${responseText}"`;
                chatMessages.appendChild(successMsg);
                
                // Force enable AI and update UI
                useAIGinko = true;
                displayChatMode();
            } else {
                throw new Error('Invalid API response format');
            }
        })
        .catch(error => {
            console.error('API test error:', error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'system-message error-message';
            errorMsg.innerHTML = `<strong>API Test Failed:</strong> ${error.message}<br>Please check your console for more details.`;
            chatMessages.appendChild(errorMsg);
        });
    }
})(); 
