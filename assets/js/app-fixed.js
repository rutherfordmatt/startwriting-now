/**
 * Start Writing Now - Main Application (Compatibility Version)
 * Non-module version that works without ES6 module support
 */

(function() {
    'use strict';

    // App Configuration (embedded)
    const APP_CONFIG = {
        TIMER_DURATION: 180,
        MIN_WORDS_FOR_STREAK: 25,
        MAX_RECENT_PROMPTS: 10,
        PROMPTS_TIMEOUT: 5000,
        SEARCH_DEBOUNCE_DELAY: 300,
        EMAIL_OFFER_COOLDOWN: 7 * 24 * 60 * 60 * 1000,
    };

    const STORAGE_KEYS = {
        WRITING_ENTRIES: 'writingEntries',
        WRITING_STREAK: 'writingStreak',
        DARK_MODE: 'darkMode',
        RECENT_PROMPTS: 'recentPrompts',
        EMAIL_BACKUP_DECLINED: 'emailBackupDeclined',
        LAST_EMAIL_BACKUP_OFFER: 'lastEmailBackupOffer',
        STREAK_EMAIL_OFFERED: 'streakEmailOffered',
    };

    const FALLBACK_PROMPTS = {
        life: [
            "What's one thing that made you smile today?",
            "Describe a moment when you felt completely at peace.",
            "What's something you're grateful for right now?",
            "If you could tell your past self one thing, what would it be?",
            "What's a small win you had recently?",
            "Describe your ideal Sunday morning.",
            "What's something new you learned this week?",
            "How do you want to feel by the end of today?",
            "What's a challenge you're facing, and how might you approach it?",
            "Describe a person who has positively impacted your life.",
            "What's something you're looking forward to?",
            "How has your perspective on something changed recently?",
            "What would you do if you knew you couldn't fail?",
            "What's a habit you'd like to develop?",
            "How do you show kindness to yourself?",
            "What's something that always makes you laugh?",
            "Describe a place where you feel most like yourself.",
            "What's the best advice you've ever received?",
            "How do you like to celebrate small victories?",
            "What's something you're curious about right now?"
        ],
        career: [
            "What's the most valuable skill you've developed this year?",
            "Describe a project you're proud of and why.",
            "What's a professional challenge you're currently navigating?",
            "How do you define success in your career?",
            "What's something you want to learn to advance professionally?",
            "Describe your ideal work environment.",
            "What's a piece of feedback that changed how you work?",
            "How do you maintain work-life balance?",
            "What's a professional relationship that has been meaningful to you?",
            "Describe a time when you had to step outside your comfort zone at work."
        ]
    };

    // Application state
    let appState = {
        externalPrompts: null,
        promptsLoaded: false,
        currentMode: 'personal',
        lastUsedPrompts: [],
        timeLeft: APP_CONFIG.TIMER_DURATION,
        timerInterval: null,
        isRunning: false,
        currentView: 'write',
        lastRenderedEntries: null
    };

    // Utility Functions
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    function getCurrentDateString() {
        return new Date().toISOString().split('T')[0];
    }

    function getTimeCategory() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 18 || hour < 5) return 'evening';
        if (day === 1) return 'monday';
        if (day === 5) return 'friday';
        if (day === 0 || day === 6) return 'weekend';
        
        return null;
    }

    // Storage Functions
    function getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    }

    function setToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error);
            return false;
        }
    }

    // Load External Prompts
    async function loadExternalPrompts() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.PROMPTS_TIMEOUT);
            
            const response = await fetch('./assets/data/prompts.json', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                appState.externalPrompts = await response.json();
                
                if (!appState.externalPrompts.prompts || 
                    !appState.externalPrompts.prompts.life || 
                    !appState.externalPrompts.prompts.career) {
                    throw new Error('Invalid prompt data structure');
                }
                
                appState.promptsLoaded = true;
                console.log('External prompts loaded successfully');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('Failed to load external prompts:', error.message);
            appState.externalPrompts = { prompts: FALLBACK_PROMPTS };
            appState.promptsLoaded = true;
            return false;
        }
    }

    // Get Prompts
    function getPrompts() {
        return appState.externalPrompts ? appState.externalPrompts.prompts : FALLBACK_PROMPTS;
    }

    // Load Recent Prompts
    function loadRecentPrompts() {
        appState.lastUsedPrompts = getFromStorage(STORAGE_KEYS.RECENT_PROMPTS, []);
    }

    // Track Used Prompt
    function trackUsedPrompt(prompt) {
        appState.lastUsedPrompts.unshift(prompt);
        if (appState.lastUsedPrompts.length > APP_CONFIG.MAX_RECENT_PROMPTS) {
            appState.lastUsedPrompts = appState.lastUsedPrompts.slice(0, APP_CONFIG.MAX_RECENT_PROMPTS);
        }
        setToStorage(STORAGE_KEYS.RECENT_PROMPTS, appState.lastUsedPrompts);
    }

    // Filter Recent Prompts
    function filterRecentPrompts(promptArray) {
        if (appState.lastUsedPrompts.length === 0) return promptArray;
        const filtered = promptArray.filter(prompt => !appState.lastUsedPrompts.includes(prompt));
        return filtered.length > 0 ? filtered : promptArray;
    }

    // Generate Smart Prompt
    function generateSmartPrompt() {
        if (!appState.promptsLoaded) {
            return 'Loading your writing prompt...';
        }

        const prompts = getPrompts();
        let promptArray = [];
        
        // Get base prompts based on mode
        if (appState.currentMode === 'professional') {
            promptArray = [...(prompts.career || FALLBACK_PROMPTS.career)];
        } else {
            promptArray = [...(prompts.life || FALLBACK_PROMPTS.life)];
        }

        // Add time-aware intelligence
        const timeCategory = getTimeCategory();
        if (timeCategory && prompts.timeAware && prompts.timeAware[timeCategory]) {
            const timePrompts = prompts.timeAware[timeCategory];
            const mixCount = Math.floor(timePrompts.length * 0.3);
            promptArray = [...promptArray, ...timePrompts.slice(0, mixCount)];
        }

        // Add mood-aware intelligence
        const currentHour = new Date().getHours();
        let smartMoodPrompts = [];
        
        if (appState.currentMode === 'personal') {
            if (currentHour >= 18 || currentHour < 6) {
                smartMoodPrompts = [
                    ...(prompts.moods?.reflective || []).slice(0, 3),
                    ...(prompts.moods?.grateful || []).slice(0, 3)
                ];
            } else if (currentHour >= 6 && currentHour < 12) {
                smartMoodPrompts = [
                    ...(prompts.moods?.energized || []).slice(0, 3),
                    ...(prompts.moods?.creative || []).slice(0, 2)
                ];
            } else {
                smartMoodPrompts = [
                    ...(prompts.moods?.reflective || []).slice(0, 2),
                    ...(prompts.moods?.creative || []).slice(0, 2)
                ];
            }
        } else {
            smartMoodPrompts = [...(prompts.moods?.energized || []).slice(0, 3)];
            
            const today = new Date().getDay();
            if (today === 1) {
                smartMoodPrompts = [
                    ...smartMoodPrompts,
                    ...(prompts.moods?.struggling || []).slice(0, 2)
                ];
            }
        }
        
        promptArray = [...promptArray, ...smartMoodPrompts];

        // Add seasonal intelligence
        if (prompts.seasonal && prompts.seasonal.current) {
            const seasonalPrompts = prompts.seasonal[prompts.seasonal.current] || [];
            if (seasonalPrompts.length > 0) {
                promptArray = [...promptArray, ...seasonalPrompts.slice(0, 3)];
            }
        }

        // Filter out recently used prompts
        promptArray = filterRecentPrompts(promptArray);

        // Final fallback
        if (promptArray.length === 0) {
            promptArray = appState.currentMode === 'professional' ? 
                FALLBACK_PROMPTS.career : FALLBACK_PROMPTS.life;
        }

        // Select and track prompt
        const randomIndex = Math.floor(Math.random() * promptArray.length);
        const selectedPrompt = promptArray[randomIndex];
        
        trackUsedPrompt(selectedPrompt);
        return selectedPrompt;
    }

    // Display Smart Prompt
    function displaySmartPrompt() {
        const promptElement = document.getElementById('currentPrompt');
        if (!promptElement) {
            console.warn('Prompt display element not found');
            return;
        }

        const promptText = generateSmartPrompt();
        promptElement.textContent = promptText;
    }

    // Global Functions (maintain compatibility)
    window.displaySmartPrompt = displaySmartPrompt;
    window.newPrompt = displaySmartPrompt;
    
    window.setMode = function(mode) {
        appState.currentMode = mode === 'career' ? 'professional' : 'personal';
        
        // Update UI
        document.querySelectorAll('.toggle-option').forEach(option => {
            option.classList.remove('active');
        });
        const modeElement = document.querySelector(`[data-mode="${mode}"]`);
        if (modeElement) {
            modeElement.classList.add('active');
        }
        
        // Get new smart prompt
        displaySmartPrompt();
    };

    // Initialize Smart Toggle
    function initSmartToggle() {
        document.querySelectorAll('.toggle-option').forEach(option => {
            option.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                if (mode) {
                    window.setMode(mode);
                }
            });
        });
        
        // Set personal as default
        window.setMode('personal');
    }

    // Initialize Dark Mode
    function initializeDarkMode() {
        const savedDarkMode = getFromStorage(STORAGE_KEYS.DARK_MODE);
        
        if (savedDarkMode === null) {
            document.body.classList.add('dark-mode');
            setToStorage(STORAGE_KEYS.DARK_MODE, true);
        } else if (savedDarkMode === true) {
            document.body.classList.add('dark-mode');
        }
        
        updateDarkModeIcon();
    }

    function updateDarkModeIcon() {
        const button = document.querySelector('.dark-mode-toggle');
        if (button) {
            const isDarkMode = document.body.classList.contains('dark-mode');
            button.textContent = isDarkMode ? '☀️' : '🌙';
        }
    }

    window.toggleDarkMode = function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        setToStorage(STORAGE_KEYS.DARK_MODE, isDarkMode);
        updateDarkModeIcon();
    };

    window.updateDarkModeIcon = updateDarkModeIcon;

    // Word Count Functions
    function updateWordCount() {
        const text = document.getElementById('writingArea')?.value || '';
        const words = countWords(text);
        const wordCountElement = document.getElementById('wordCount');
        if (wordCountElement) {
            wordCountElement.textContent = `${words} words`;
        }
    }

    window.updateWordCount = updateWordCount;

    // Timer Functions
    function startTimer() {
        if (!appState.isRunning) {
            appState.isRunning = true;
            const pauseBtn = document.getElementById('pauseBtn');
            if (pauseBtn) {
                pauseBtn.style.visibility = 'visible';
            }
            
            appState.timerInterval = setInterval(() => {
                appState.timeLeft--;
                updateTimerDisplay();
                
                if (appState.timeLeft <= 0) {
                    finishTimer();
                }
            }, 1000);
        }
    }

    function pauseTimer() {
        if (appState.isRunning) {
            appState.isRunning = false;
            clearInterval(appState.timerInterval);
            const pauseBtn = document.getElementById('pauseBtn');
            if (pauseBtn) {
                pauseBtn.style.visibility = 'hidden';
            }
        }
    }

    function updateTimerDisplay() {
        const timerElement = document.getElementById('timerDisplay');
        if (timerElement) {
            timerElement.textContent = formatTime(appState.timeLeft);
        }
    }

    function finishTimer() {
        appState.isRunning = false;
        clearInterval(appState.timerInterval);
        appState.timeLeft = 0;
        updateTimerDisplay();
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.visibility = 'hidden';
        }
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.classList.add('timer-finished', 'pulse');
        }
        
        // Play chime and show celebration
        playChime();
        setTimeout(() => {
            alert('Great job! You completed your 3-minute writing session. 🎉');
        }, 500);
    }

    // Audio function (simplified)
    function playChime() {
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                if (audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        createChimeNotes(audioContext);
                    }).catch(err => {
                        console.warn('Could not resume audio context:', err);
                    });
                } else {
                    createChimeNotes(audioContext);
                }
            }
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }

    function createChimeNotes(audioContext) {
        const frequencies = [523.25, 659.25, 783.99];
        
        frequencies.forEach((freq, index) => {
            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                const startTime = audioContext.currentTime + index * 0.2;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 1.5);
            } catch (noteError) {
                console.warn(`Failed to create note ${freq}Hz:`, noteError);
            }
        });
    }

    // Global timer functions
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.updateTimerDisplay = updateTimerDisplay;
    window.finishTimer = finishTimer;
    window.playChime = playChime;

    // Initialize the app
    async function initApp() {
        try {
            console.log('Initializing Start Writing Now...');

            // Load external prompts first
            await loadExternalPrompts();
            loadRecentPrompts();

            // Initialize UI
            initSmartToggle();
            displaySmartPrompt();
            updateWordCount();
            initializeDarkMode();

            // Add textarea event listener
            const textarea = document.getElementById('writingArea');
            if (textarea) {
                textarea.addEventListener('input', function() {
                    updateWordCount();
                    // Auto-start timer when user starts typing
                    if (!appState.isRunning && textarea.value.trim().length > 0 && appState.timeLeft === APP_CONFIG.TIMER_DURATION) {
                        startTimer();
                    }
                });
            }

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    // Also support window load
    window.addEventListener('load', function() {
        if (!appState.promptsLoaded) {
            initApp();
        }
    });

})();