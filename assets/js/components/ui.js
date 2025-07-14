/**
 * Start Writing Now - UI Component
 * User interface interactions and DOM manipulation
 */

import { MESSAGES } from '../config/constants.js';
import { PreferencesStorage } from './storage.js';
import { countWords } from '../utils/helpers.js';

/**
 * UI management class
 */
export class UIManager {
    constructor() {
        this.currentView = 'write';
        this.wordCountElement = document.getElementById('wordCount');
        this.writingArea = document.getElementById('writingArea');
        this.darkModeToggle = document.querySelector('.dark-mode-toggle');
        
        this.bindElements();
        this.setupEventListeners();
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        if (!this.wordCountElement) {
            console.warn('Word count element not found');
        }
        
        if (!this.writingArea) {
            console.warn('Writing area element not found');
        }
        
        if (!this.darkModeToggle) {
            console.warn('Dark mode toggle not found');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Word count update
        if (this.writingArea) {
            this.writingArea.addEventListener('input', () => {
                this.updateWordCount();
            });
        }

        // Smart toggle setup
        this.setupSmartToggle();
    }

    /**
     * Setup smart toggle for Personal/Professional mode
     */
    setupSmartToggle() {
        document.querySelectorAll('.toggle-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-mode');
                if (mode) {
                    // Import setMode function dynamically to avoid circular dependencies
                    import('./prompts.js').then(({ setMode }) => {
                        setMode(mode);
                    }).catch(error => {
                        console.warn('Could not load prompts module:', error);
                    });
                }
            });
        });
    }

    /**
     * Update word count display
     */
    updateWordCount() {
        if (!this.wordCountElement || !this.writingArea) return;

        const text = this.writingArea.value;
        const wordCount = countWords(text);
        this.wordCountElement.textContent = `${wordCount} words`;
    }

    /**
     * Get current text from writing area
     * @returns {string} Current text
     */
    getCurrentText() {
        return this.writingArea ? this.writingArea.value : '';
    }

    /**
     * Get current word count
     * @returns {number} Current word count
     */
    getCurrentWordCount() {
        const text = this.getCurrentText();
        return countWords(text);
    }

    /**
     * Clear writing area
     */
    clearWritingArea() {
        if (this.writingArea) {
            this.writingArea.value = '';
            this.updateWordCount();
        }
    }

    /**
     * Show write view
     */
    showWriteView() {
        this.currentView = 'write';
        
        const writeView = document.getElementById('writeView');
        const historyView = document.getElementById('historyView');
        
        if (writeView) writeView.classList.remove('hidden');
        if (historyView) historyView.classList.add('hidden');
        
        this.updateViewButtons(0);
    }

    /**
     * Show history view
     */
    showHistoryView() {
        this.currentView = 'history';
        
        const writeView = document.getElementById('writeView');
        const historyView = document.getElementById('historyView');
        
        if (writeView) writeView.classList.add('hidden');
        if (historyView) historyView.classList.remove('hidden');
        
        this.updateViewButtons(1);
        
        // Update history display when switching to history view
        import('./history.js').then(({ updateHistoryDisplay }) => {
            updateHistoryDisplay();
        }).catch(error => {
            console.warn('Could not load history module:', error);
        });
    }

    /**
     * Update view button states
     * @param {number} activeIndex - Index of active button
     */
    updateViewButtons(activeIndex) {
        const viewButtons = document.querySelectorAll('.view-btn');
        
        viewButtons.forEach((btn, index) => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        if (viewButtons[activeIndex]) {
            viewButtons[activeIndex].classList.add('active');
            viewButtons[activeIndex].setAttribute('aria-selected', 'true');
        }
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        PreferencesStorage.setDarkMode(isDarkMode);
        this.updateDarkModeIcon();
    }

    /**
     * Update dark mode toggle icon
     */
    updateDarkModeIcon() {
        if (!this.darkModeToggle) return;

        const isDarkMode = document.body.classList.contains('dark-mode');
        this.darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    }

    /**
     * Initialize dark mode from preferences
     */
    initializeDarkMode() {
        const savedDarkMode = PreferencesStorage.getDarkMode();
        
        if (savedDarkMode === null) {
            // First visit - default to dark mode
            document.body.classList.add('dark-mode');
            PreferencesStorage.setDarkMode(true);
        } else if (savedDarkMode === true) {
            document.body.classList.add('dark-mode');
        }
        
        this.updateDarkModeIcon();
    }

    /**
     * Show about dialog
     */
    showAbout() {
        alert(MESSAGES.ABOUT_TEXT);
    }

    /**
     * Validate writing input
     * @returns {Object} Validation result
     */
    validateWritingInput() {
        const text = this.getCurrentText();
        const wordCount = this.getCurrentWordCount();
        
        if (text.trim().length === 0) {
            return {
                valid: false,
                message: 'Please write something before saving!',
                text: '',
                wordCount: 0
            };
        }
        
        return {
            valid: true,
            text: text,
            wordCount: wordCount
        };
    }

    /**
     * Focus writing area
     */
    focusWritingArea() {
        if (this.writingArea) {
            this.writingArea.focus();
        }
    }

    /**
     * Get current view
     * @returns {string} Current view name
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Check if timer should auto-start
     * @returns {boolean} Should auto-start
     */
    shouldAutoStartTimer() {
        const text = this.getCurrentText();
        
        // Import timer state check dynamically
        return import('./timer.js').then(({ getTimerState }) => {
            const timerState = getTimerState();
            return !timerState.isRunning && 
                   text.trim().length > 0 && 
                   timerState.isAtInitialTime;
        }).catch(() => false);
    }

    /**
     * Setup auto-start timer functionality
     */
    setupAutoStartTimer() {
        if (!this.writingArea) return;

        this.writingArea.addEventListener('input', async () => {
            this.updateWordCount();
            
            const shouldStart = await this.shouldAutoStartTimer();
            if (shouldStart) {
                import('./timer.js').then(({ startTimer }) => {
                    startTimer();
                }).catch(error => {
                    console.warn('Could not start timer:', error);
                });
            }
        });
    }
}

// Global UI manager instance
let uiManager = null;

/**
 * Get or create UI manager instance
 * @returns {UIManager} UI manager instance
 */
export function getUIManager() {
    if (!uiManager) {
        uiManager = new UIManager();
    }
    return uiManager;
}

/**
 * Global functions for backward compatibility
 */

/**
 * Update word count display
 */
export function updateWordCount() {
    const manager = getUIManager();
    manager.updateWordCount();
}

/**
 * Show write view
 */
export function showWriteView() {
    const manager = getUIManager();
    manager.showWriteView();
}

/**
 * Show history view
 */
export function showHistoryView() {
    const manager = getUIManager();
    manager.showHistoryView();
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
    const manager = getUIManager();
    manager.toggleDarkMode();
}

/**
 * Update dark mode icon
 */
export function updateDarkModeIcon() {
    const manager = getUIManager();
    manager.updateDarkModeIcon();
}

/**
 * Show about dialog
 */
export function showAbout() {
    const manager = getUIManager();
    manager.showAbout();
}

/**
 * Get current writing text and word count
 * @returns {Object} Text and word count
 */
export function getCurrentWriting() {
    const manager = getUIManager();
    return {
        text: manager.getCurrentText(),
        wordCount: manager.getCurrentWordCount()
    };
}

/**
 * Validate current writing input
 * @returns {Object} Validation result
 */
export function validateWritingInput() {
    const manager = getUIManager();
    return manager.validateWritingInput();
}