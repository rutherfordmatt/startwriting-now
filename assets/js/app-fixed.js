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

    // VIEW SWITCHING FUNCTIONS
    window.showWriteView = function() {
        appState.currentView = 'write';
        const writeView = document.getElementById('writeView');
        const historyView = document.getElementById('historyView');
        
        if (writeView) writeView.classList.remove('hidden');
        if (historyView) historyView.classList.add('hidden');
        
        // Update view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach((btn, index) => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        if (viewButtons[0]) {
            viewButtons[0].classList.add('active');
            viewButtons[0].setAttribute('aria-selected', 'true');
        }
    };

    window.showHistoryView = function() {
        appState.currentView = 'history';
        const writeView = document.getElementById('writeView');
        const historyView = document.getElementById('historyView');
        
        if (writeView) writeView.classList.add('hidden');
        if (historyView) historyView.classList.remove('hidden');
        
        // Update view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach((btn, index) => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        if (viewButtons[1]) {
            viewButtons[1].classList.add('active');
            viewButtons[1].setAttribute('aria-selected', 'true');
        }
        
        updateHistoryDisplay();
    };

    // HISTORY FUNCTIONS
    function getEntries() {
        return getFromStorage(STORAGE_KEYS.WRITING_ENTRIES, []);
    }

    function saveEntryToHistory(prompt, text, wordCount, mode) {
        const entries = getEntries();
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            prompt: prompt,
            text: text,
            wordCount: wordCount,
            mode: mode || appState.currentMode
        };
        
        entries.unshift(entry);
        setToStorage(STORAGE_KEYS.WRITING_ENTRIES, entries);
        updateHistoryDisplay();
        return entry;
    }

    function updateHistoryDisplay() {
        const entries = getEntries();
        const container = document.getElementById('entriesContainer');
        const stats = document.getElementById('historyStats');
        
        if (!container || !stats) return;

        // Update stats
        const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
        stats.textContent = `${entries.length} entries • ${totalWords} total words`;
        
        if (entries.length === 0) {
            container.innerHTML = '<div class="no-entries">No entries yet. Start writing to see your history!</div>';
            return;
        }

        // Render entries
        const entriesHTML = entries.map(entry => {
            try {
                const date = new Date(entry.date);
                if (isNaN(date.getTime())) return '';
                
                const formattedDate = date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const safeText = (entry.text || '').toString();
                const preview = safeText.length > 200 ? safeText.substring(0, 200) + '...' : safeText;
                
                const escapeHtml = (text) => {
                    const div = document.createElement('div');
                    div.textContent = text || '';
                    return div.innerHTML;
                };
                
                const modeEmoji = entry.mode === 'professional' ? '💼' : '💭';
                const modeName = entry.mode || 'personal';
                
                return `
                    <div class="entry-item" data-entry-id="${entry.id}">
                        <div class="entry-header">
                            <div class="entry-date">${formattedDate}</div>
                            <div class="entry-meta">
                                <span>${entry.wordCount || 0} words</span>
                                <span>${modeEmoji} ${modeName}</span>
                            </div>
                        </div>
                        <div class="entry-prompt">${escapeHtml(entry.prompt || 'No prompt')}</div>
                        <div class="entry-text">${escapeHtml(preview)}</div>
                        <div class="entry-actions">
                            <button class="btn-entry-action" onclick="copyEntry('${entry.id}')">Copy</button>
                            <button class="btn-entry-action" onclick="downloadEntry('${entry.id}')">Download</button>
                            <button class="btn-entry-action" onclick="deleteEntry('${entry.id}')">Delete</button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error rendering entry:', entry.id, error);
                return '';
            }
        }).filter(html => html).join('');
        
        container.innerHTML = entriesHTML;
    }

    window.updateHistoryDisplay = updateHistoryDisplay;
    window.saveEntryToHistory = saveEntryToHistory;

    // HISTORY ACTION FUNCTIONS
    window.copyEntry = function(entryId) {
        const entries = getEntries();
        const entry = entries.find(e => e.id == entryId);
        if (!entry) return;
        
        const timestamp = new Date(entry.date).toLocaleString();
        const formattedEntry = `Start Writing Now - Journal Entry
Date: ${timestamp}
Prompt: ${entry.prompt}

${entry.text}

---
startwriting.now`;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(formattedEntry).then(() => {
                alert('Entry copied to clipboard! 📋');
            });
        } else {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = formattedEntry;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                alert('Entry copied to clipboard! 📋');
            } catch (err) {
                alert('Unable to copy to clipboard.');
            }
            
            document.body.removeChild(textArea);
        }
    };

    window.downloadEntry = function(entryId) {
        const entries = getEntries();
        const entry = entries.find(e => e.id == entryId);
        if (!entry) return;
        
        const timestamp = new Date(entry.date).toLocaleString();
        const formattedEntry = `Start Writing Now - Journal Entry
Date: ${timestamp}
Prompt: ${entry.prompt}

${entry.text}

---
startwriting.now
`;
        
        const blob = new Blob([formattedEntry], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-entry-${new Date(entry.date).toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.deleteEntry = function(entryId) {
        if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
            return;
        }
        
        const entries = getEntries();
        const filteredEntries = entries.filter(e => e.id != entryId);
        setToStorage(STORAGE_KEYS.WRITING_ENTRIES, filteredEntries);
        updateHistoryDisplay();
    };

    window.exportAllEntries = function() {
        const entries = getEntries();
        if (entries.length === 0) {
            alert('No entries to export!');
            return;
        }
        
        const allEntries = entries.map(entry => {
            const timestamp = new Date(entry.date).toLocaleString();
            return `Start Writing Now - Journal Entry
Date: ${timestamp}
Prompt: ${entry.prompt}

${entry.text}

---`;
        }).join('\n\n');
        
        const finalContent = `${allEntries}

Complete Journal Export from startwriting.now
Total Entries: ${entries.length}
Total Words: ${entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0)}
Exported: ${new Date().toLocaleString()}`;
        
        const blob = new Blob([finalContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-journal-entries-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Exported ${entries.length} entries! 📥`);
    };

    window.clearAllHistory = function() {
        if (!confirm('Are you sure you want to delete ALL entries? This cannot be undone.')) {
            return;
        }
        
        if (!confirm('This will permanently delete all your writing history. Are you absolutely sure?')) {
            return;
        }
        
        localStorage.removeItem(STORAGE_KEYS.WRITING_ENTRIES);
        updateHistoryDisplay();
        alert('All entries have been deleted.');
    };

    window.filterEntries = function() {
        const searchTerm = document.getElementById('historySearch')?.value.toLowerCase() || '';
        const entries = document.querySelectorAll('.entry-item');
        let visibleCount = 0;
        
        entries.forEach(entry => {
            const text = entry.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            entry.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        });
        
        // Update stats
        const statsElement = document.getElementById('historyStats');
        if (statsElement) {
            if (searchTerm) {
                const totalEntries = entries.length;
                statsElement.textContent = `${visibleCount} of ${totalEntries} entries shown`;
            } else {
                const allEntries = getEntries();
                const totalWords = allEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
                statsElement.textContent = `${allEntries.length} entries • ${totalWords} total words`;
            }
        }
    };

    // COPY AND SAVE FUNCTIONS
    window.copyToClipboard = function() {
        const prompt = document.getElementById('currentPrompt')?.textContent || '';
        const entry = document.getElementById('writingArea')?.value || '';
        
        if (entry.trim().length === 0) {
            alert('Please write something before copying!');
            return;
        }

        const words = countWords(entry);
        if (words >= APP_CONFIG.MIN_WORDS_FOR_STREAK) {
            updateStreak();
            saveEntryToHistory(prompt, entry, words, appState.currentMode);
        }
        
        const timestamp = new Date().toLocaleString();
        const formattedEntry = `Start Writing Now - Journal Entry
Date: ${timestamp}
Prompt: ${prompt}

${entry}

---
startwriting.now`;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(formattedEntry).then(() => {
                const message = words >= APP_CONFIG.MIN_WORDS_FOR_STREAK ? 
                    'Entry copied to clipboard! 📋' : 
                    'Entry copied to clipboard! Write 25+ words next time to count toward your streak. 📋';
                alert(message);
            });
        } else {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = formattedEntry;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                const message = words >= APP_CONFIG.MIN_WORDS_FOR_STREAK ? 
                    'Entry copied to clipboard! 📋' : 
                    'Entry copied to clipboard! Write 25+ words next time to count toward your streak. 📋';
                alert(message);
            } catch (err) {
                alert('Unable to copy to clipboard. Please try the download option instead.');
            }
            
            document.body.removeChild(textArea);
        }
    };

    window.saveEntry = function() {
        const prompt = document.getElementById('currentPrompt')?.textContent || '';
        const entry = document.getElementById('writingArea')?.value || '';
        
        if (entry.trim().length === 0) {
            alert('Please write something before downloading!');
            return;
        }

        const words = countWords(entry);
        if (words >= APP_CONFIG.MIN_WORDS_FOR_STREAK) {
            updateStreak();
            saveEntryToHistory(prompt, entry, words, appState.currentMode);
        }
        
        const timestamp = new Date().toLocaleString();
        const formattedEntry = `Start Writing Now - Journal Entry
Date: ${timestamp}
Prompt: ${prompt}

${entry}

---
startwriting.now
`;
        
        const blob = new Blob([formattedEntry], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-entry-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const message = words >= APP_CONFIG.MIN_WORDS_FOR_STREAK ? 
            'Your journal entry has been downloaded! 📝' : 
            'Your journal entry has been downloaded! Write 25+ words next time to count toward your streak. 📝';
        alert(message);
    };

    // STREAK FUNCTIONS
    function getStreakData() {
        const defaultData = {
            currentStreak: 0,
            longestStreak: 0,
            lastWriteDate: null,
            writingDays: []
        };
        
        return getFromStorage(STORAGE_KEYS.WRITING_STREAK, defaultData);
    }

    function saveStreakData(data) {
        setToStorage(STORAGE_KEYS.WRITING_STREAK, data);
    }

    function updateStreak() {
        const today = getCurrentDateString();
        const streakData = getStreakData();
        
        if (streakData.writingDays.includes(today)) {
            return;
        }
        
        streakData.writingDays.push(today);
        streakData.lastWriteDate = today;
        
        const sortedDays = streakData.writingDays.sort();
        let currentStreak = 1;
        
        for (let i = sortedDays.length - 2; i >= 0; i--) {
            const currentDate = new Date(sortedDays[i + 1]);
            const previousDate = new Date(sortedDays[i]);
            const dayDiff = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        streakData.currentStreak = currentStreak;
        
        if (currentStreak > streakData.longestStreak) {
            streakData.longestStreak = currentStreak;
        }
        
        saveStreakData(streakData);
        updateStreakDisplay();
        celebrateStreak(currentStreak);
    }

    function updateStreakDisplay() {
        const streakData = getStreakData();
        const display = document.getElementById('streakDisplay');
        
        if (!display) return;
        
        if (streakData.currentStreak === 0) {
            display.textContent = 'Start your writing streak!';
        } else if (streakData.currentStreak === 1) {
            display.textContent = '🔥 Day 1 - Keep it going!';
        } else {
            display.textContent = `🔥 ${streakData.currentStreak} day streak`;
            if (streakData.longestStreak > streakData.currentStreak) {
                display.textContent += ` (Best: ${streakData.longestStreak})`;
            }
        }
    }

    function celebrateStreak(streak) {
        let message = '';
        
        if (streak === 1) {
            message = 'Great job starting your writing streak! 🎉';
        } else if (streak === 3) {
            message = 'Amazing! 3 days in a row! 🔥';
        } else if (streak === 7) {
            message = 'Incredible! You\'ve written for a whole week! 🌟';
        } else if (streak === 14) {
            message = 'Two weeks of writing! You\'re building a real habit! 💪';
        } else if (streak === 30) {
            message = 'One month streak! You\'re a writing champion! 🏆';
        } else if (streak % 10 === 0 && streak > 30) {
            message = `${streak} days of writing! Absolutely incredible! 🎊`;
        }
        
        if (message) {
            setTimeout(() => alert(message), 1000);
        }
    }

    window.updateStreakDisplay = updateStreakDisplay;
    window.updateStreak = updateStreak;
    window.getStreakData = getStreakData;
    window.saveStreakData = saveStreakData;
    window.celebrateStreak = celebrateStreak;

    // ABOUT FUNCTION
    window.showAbout = function() {
        alert(`About Start Writing

This is an intelligent micro-journaling app designed to help you capture your thoughts with the perfect prompts.

How it works:
• Choose Personal or Professional writing mode
• Get smart prompts that adapt to time of day and season
• Start typing to begin the 3-minute timer
• Write freely without worrying about structure
• Your entries are automatically saved to your history

Smart Features:
• Time-aware prompts (different for morning vs evening)
• Intelligent prompt selection that avoids recent duplicates
• Seasonal and contextual awareness
• Full writing history with search and export
• Works completely offline

The goal is to make writing a daily habit through short, focused sessions with perfectly matched prompts. No accounts needed - everything saves locally in your browser.

Perfect for daily reflection, gratitude practice, career planning, or creative expression.`);
    };

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
            updateStreakDisplay();
            updateHistoryDisplay();
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