/**
 * Start Writing Now - Timer Component
 * Timer functionality and display management
 */

import { APP_CONFIG, MESSAGES } from '../config/constants.js';
import { formatTime } from '../utils/helpers.js';
import { playTimerChime } from '../utils/audio.js';

/**
 * Timer management class
 */
export class Timer {
    constructor() {
        this.timeLeft = APP_CONFIG.TIMER_DURATION;
        this.interval = null;
        this.isRunning = false;
        this.onUpdate = null;
        this.onComplete = null;
        
        // DOM elements
        this.displayElement = null;
        this.pauseButton = null;
        
        this.bindElements();
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.displayElement = document.getElementById('timerDisplay');
        this.pauseButton = document.getElementById('pauseBtn');
        
        if (!this.displayElement) {
            console.warn('Timer display element not found');
        }
        
        if (!this.pauseButton) {
            console.warn('Timer pause button not found');
        }
    }

    /**
     * Set update callback
     * @param {Function} callback - Function called on timer updates
     */
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }

    /**
     * Set completion callback
     * @param {Function} callback - Function called when timer completes
     */
    setCompleteCallback(callback) {
        this.onComplete = callback;
    }

    /**
     * Start the timer
     * @returns {boolean} Success status
     */
    start() {
        if (this.isRunning) {
            return false;
        }

        this.isRunning = true;
        this.showPauseButton();
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.onUpdate) {
                this.onUpdate(this.timeLeft);
            }
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);

        return true;
    }

    /**
     * Pause the timer
     * @returns {boolean} Success status
     */
    pause() {
        if (!this.isRunning) {
            return false;
        }

        this.isRunning = false;
        this.clearInterval();
        this.hidePauseButton();
        
        return true;
    }

    /**
     * Reset the timer
     * @returns {boolean} Success status
     */
    reset() {
        this.pause();
        this.timeLeft = APP_CONFIG.TIMER_DURATION;
        this.updateDisplay();
        this.removeFinishedState();
        
        return true;
    }

    /**
     * Complete the timer
     */
    complete() {
        this.isRunning = false;
        this.clearInterval();
        this.timeLeft = 0;
        this.updateDisplay();
        this.hidePauseButton();
        this.addFinishedState();
        
        // Play chime and show celebration
        this.celebrate();
        
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Update timer display
     */
    updateDisplay() {
        if (this.displayElement) {
            this.displayElement.textContent = formatTime(this.timeLeft);
        }
    }

    /**
     * Show pause button
     */
    showPauseButton() {
        if (this.pauseButton) {
            this.pauseButton.style.visibility = 'visible';
        }
    }

    /**
     * Hide pause button
     */
    hidePauseButton() {
        if (this.pauseButton) {
            this.pauseButton.style.visibility = 'hidden';
        }
    }

    /**
     * Add finished state styling
     */
    addFinishedState() {
        if (this.displayElement) {
            this.displayElement.classList.add('timer-finished', 'pulse');
        }
    }

    /**
     * Remove finished state styling
     */
    removeFinishedState() {
        if (this.displayElement) {
            this.displayElement.classList.remove('timer-finished', 'pulse');
        }
    }

    /**
     * Clear the interval
     */
    clearInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Play celebration for timer completion
     */
    async celebrate() {
        try {
            // Play chime sound
            await playTimerChime();
            
            // Show celebration message after a short delay
            setTimeout(() => {
                alert(MESSAGES.TIMER_COMPLETE);
            }, 500);
        } catch (error) {
            console.warn('Error during timer celebration:', error);
            // Still show message even if audio fails
            setTimeout(() => {
                alert(MESSAGES.TIMER_COMPLETE);
            }, 500);
        }
    }

    /**
     * Get current time left
     * @returns {number} Seconds remaining
     */
    getTimeLeft() {
        return this.timeLeft;
    }

    /**
     * Get running status
     * @returns {boolean} Is timer running
     */
    getIsRunning() {
        return this.isRunning;
    }

    /**
     * Check if timer is at initial state
     * @returns {boolean} Is at initial time
     */
    isAtInitialTime() {
        return this.timeLeft === APP_CONFIG.TIMER_DURATION;
    }

    /**
     * Cleanup timer resources
     */
    cleanup() {
        this.clearInterval();
        this.isRunning = false;
        this.onUpdate = null;
        this.onComplete = null;
    }
}

// Global timer instance
let timerInstance = null;

/**
 * Get or create timer instance
 * @returns {Timer} Timer instance
 */
export function getTimer() {
    if (!timerInstance) {
        timerInstance = new Timer();
    }
    return timerInstance;
}

/**
 * Global timer functions for backward compatibility
 */

/**
 * Start the global timer
 */
export function startTimer() {
    const timer = getTimer();
    timer.start();
}

/**
 * Pause the global timer
 */
export function pauseTimer() {
    const timer = getTimer();
    timer.pause();
}

/**
 * Reset the global timer
 */
export function resetTimer() {
    const timer = getTimer();
    timer.reset();
}

/**
 * Update timer display
 */
export function updateTimerDisplay() {
    const timer = getTimer();
    timer.updateDisplay();
}

/**
 * Complete the timer (for external triggers)
 */
export function finishTimer() {
    const timer = getTimer();
    timer.complete();
}

/**
 * Get timer state for external use
 * @returns {Object} Timer state
 */
export function getTimerState() {
    const timer = getTimer();
    return {
        timeLeft: timer.getTimeLeft(),
        isRunning: timer.getIsRunning(),
        isAtInitialTime: timer.isAtInitialTime()
    };
}

/**
 * Cleanup timer resources
 */
export function cleanupTimer() {
    if (timerInstance) {
        timerInstance.cleanup();
        timerInstance = null;
    }
}