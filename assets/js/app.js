/**
 * Start Writing Now - Main Application
 * Application initialization and coordination
 */

// Import all components
import { initializePrompts, setMode, newPrompt, getCurrentPrompt } from './components/prompts.js';
import { getTimer, startTimer, pauseTimer, updateTimerDisplay } from './components/timer.js';
import { updateStreakDisplay } from './components/streak.js';
import { updateHistoryDisplay } from './components/history.js';
import { getUIManager, updateWordCount, showWriteView, showHistoryView, toggleDarkMode, showAbout } from './components/ui.js';
import { copyToClipboard, saveEntry } from './components/actions.js';
import { cleanupAudio } from './utils/audio.js';

/**
 * Main application class
 */
export class App {
    constructor() {
        this.initialized = false;
        this.uiManager = null;
        this.timer = null;
    }

    /**
     * Initialize the application
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.initialized) {
            console.warn('App already initialized');
            return true;
        }

        try {
            console.log('Initializing Start Writing Now...');

            // Initialize UI manager
            this.uiManager = getUIManager();
            this.uiManager.initializeDarkMode();
            this.uiManager.setupAutoStartTimer();

            // Initialize prompts system
            await initializePrompts();

            // Initialize timer
            this.timer = getTimer();

            // Initialize UI displays
            updateWordCount();
            updateStreakDisplay();
            updateHistoryDisplay();

            // Set personal mode as default
            setMode('personal');

            // Setup global error handling
            this.setupErrorHandling();

            // Setup cleanup on page unload
            this.setupCleanup();

            this.initialized = true;
            console.log('Start Writing Now initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize app:', error);
            return false;
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            // Don't show alerts for every error, just log them
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Prevent the default behavior (console error)
            event.preventDefault();
        });
    }

    /**
     * Setup cleanup on page unload
     */
    setupCleanup() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Cleanup application resources
     */
    cleanup() {
        try {
            // Cleanup audio resources
            cleanupAudio();
            
            // Cleanup timer
            if (this.timer) {
                this.timer.cleanup();
            }

            console.log('App cleanup completed');
        } catch (error) {
            console.warn('Error during app cleanup:', error);
        }
    }

    /**
     * Get application state
     * @returns {Object} Application state
     */
    getState() {
        return {
            initialized: this.initialized,
            currentView: this.uiManager ? this.uiManager.getCurrentView() : 'unknown',
            timerState: this.timer ? {
                timeLeft: this.timer.getTimeLeft(),
                isRunning: this.timer.getIsRunning()
            } : null
        };
    }
}

// Global app instance
let appInstance = null;

/**
 * Get or create app instance
 * @returns {App} App instance
 */
export function getApp() {
    if (!appInstance) {
        appInstance = new App();
    }
    return appInstance;
}

/**
 * Initialize the application
 * @returns {Promise<boolean>} Success status
 */
export async function initApp() {
    const app = getApp();
    return await app.initialize();
}

/**
 * Global functions for backward compatibility
 * These maintain the same function names as the original code
 */

// Timer functions
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.updateTimerDisplay = updateTimerDisplay;

// Prompt functions
window.newPrompt = newPrompt;
window.setMode = setMode;

// UI functions
window.updateWordCount = updateWordCount;
window.showWriteView = showWriteView;
window.showHistoryView = showHistoryView;
window.toggleDarkMode = toggleDarkMode;
window.showAbout = showAbout;

// Action functions
window.copyToClipboard = copyToClipboard;
window.saveEntry = saveEntry;

// History functions - Import dynamically to avoid circular dependencies
window.updateHistoryDisplay = () => {
    import('./components/history.js').then(({ updateHistoryDisplay }) => {
        updateHistoryDisplay();
    });
};

window.saveEntryToHistory = (prompt, text, wordCount, mode) => {
    import('./components/history.js').then(({ saveEntryToHistory }) => {
        saveEntryToHistory(prompt, text, wordCount, mode);
    });
};

window.filterEntries = () => {
    import('./components/history.js').then(({ filterEntries }) => {
        filterEntries();
    });
};

window.copyEntry = (entryId) => {
    import('./components/history.js').then(({ copyEntry }) => {
        copyEntry(entryId);
    });
};

window.downloadEntry = (entryId) => {
    import('./components/history.js').then(({ downloadEntry }) => {
        downloadEntry(entryId);
    });
};

window.deleteEntry = (entryId) => {
    import('./components/history.js').then(({ deleteEntry }) => {
        deleteEntry(entryId);
    });
};

window.exportAllEntries = () => {
    import('./components/history.js').then(({ exportAllEntries }) => {
        exportAllEntries();
    });
};

window.clearAllHistory = () => {
    import('./components/history.js').then(({ clearAllHistory }) => {
        clearAllHistory();
    });
};

// Streak functions
window.updateStreakDisplay = () => {
    import('./components/streak.js').then(({ updateStreakDisplay }) => {
        updateStreakDisplay();
    });
};

window.updateStreak = (wordCount) => {
    import('./components/streak.js').then(({ updateStreak }) => {
        updateStreak(wordCount);
    });
};

// Email functions
window.offerEmailBackup = (entryText) => {
    import('./components/email.js').then(({ offerEmailBackup }) => {
        offerEmailBackup(entryText);
    });
};

window.offerStreakProtection = () => {
    import('./components/email.js').then(({ offerStreakProtection }) => {
        offerStreakProtection();
    });
};

window.collectEmailForNewsletter = (source, preview) => {
    import('./components/email.js').then(({ collectEmailForNewsletter }) => {
        collectEmailForNewsletter(source, preview);
    });
};

// Legacy functions that were in the original code
window.getEntries = () => {
    return import('./components/storage.js').then(({ EntriesStorage }) => {
        return EntriesStorage.getEntries();
    });
};

window.getStreakData = () => {
    return import('./components/storage.js').then(({ StreakStorage }) => {
        return StreakStorage.getStreakData();
    });
};

window.saveStreakData = (data) => {
    return import('./components/storage.js').then(({ StreakStorage }) => {
        return StreakStorage.saveStreakData(data);
    });
};

window.celebrateStreak = (streak) => {
    return import('./components/streak.js').then(({ celebrateStreak }) => {
        return celebrateStreak(streak);
    });
};

window.fallbackCopyToClipboard = (text, wordCount) => {
    return import('./components/actions.js').then(({ fallbackCopyToClipboard }) => {
        return fallbackCopyToClipboard(text, wordCount);
    });
};

// Audio functions
window.playChime = () => {
    return import('./utils/audio.js').then(({ playTimerChime }) => {
        return playTimerChime();
    });
};

// Initialize Smart Toggle - legacy function
window.initSmartToggle = () => {
    // This is now handled automatically by the UI manager
    console.log('Smart toggle initialized by UI manager');
};

// Display Smart Prompt - legacy function
window.displaySmartPrompt = () => {
    import('./components/prompts.js').then(({ displaySmartPrompt }) => {
        displaySmartPrompt();
    });
};

/**
 * Initialize app when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const success = await initApp();
        if (!success) {
            console.error('Failed to initialize application');
        }
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
});

// Also support the legacy window.addEventListener('load') pattern
window.addEventListener('load', async () => {
    // Check if already initialized by DOMContentLoaded
    const app = getApp();
    if (!app.initialized) {
        try {
            const success = await initApp();
            if (!success) {
                console.error('Failed to initialize application');
            }
        } catch (error) {
            console.error('Error during app initialization:', error);
        }
    }
});