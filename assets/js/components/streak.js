/**
 * Start Writing Now - Streak Component
 * Streak tracking and celebration management
 */

import { APP_CONFIG, STREAK_MESSAGES } from '../config/constants.js';
import { StreakStorage } from './storage.js';
import { getCurrentDateString } from '../utils/helpers.js';

/**
 * Streak management class
 */
export class StreakManager {
    constructor() {
        this.displayElement = document.getElementById('streakDisplay');
        
        if (!this.displayElement) {
            console.warn('Streak display element not found');
        }
    }

    /**
     * Update streak for writing session
     * @param {number} wordCount - Number of words written
     * @returns {Object|null} Updated streak data or null if not qualifying
     */
    updateStreak(wordCount) {
        // Only count entries with minimum word count
        if (wordCount < APP_CONFIG.MIN_WORDS_FOR_STREAK) {
            return null;
        }

        const today = getCurrentDateString();
        const updatedStreak = StreakStorage.addWritingDay(today);
        
        this.updateDisplay();
        this.celebrateStreak(updatedStreak.currentStreak);
        
        return updatedStreak;
    }

    /**
     * Update streak display
     */
    updateDisplay() {
        if (!this.displayElement) return;

        const streakData = StreakStorage.getStreakData();
        
        if (streakData.currentStreak === 0) {
            this.displayElement.textContent = 'Start your writing streak!';
        } else if (streakData.currentStreak === 1) {
            this.displayElement.textContent = '🔥 Day 1 - Keep it going!';
        } else {
            this.displayElement.textContent = `🔥 ${streakData.currentStreak} day streak`;
            if (streakData.longestStreak > streakData.currentStreak) {
                this.displayElement.textContent += ` (Best: ${streakData.longestStreak})`;
            }
        }
    }

    /**
     * Celebrate streak milestones
     * @param {number} streak - Current streak count
     */
    celebrateStreak(streak) {
        const message = this.getStreakMessage(streak);
        
        if (message) {
            setTimeout(() => {
                alert(message);
                
                // Special actions for certain milestones
                if (streak === 7) {
                    setTimeout(() => {
                        this.offerStreakProtection();
                    }, 2000);
                }
            }, 1000);
        }
    }

    /**
     * Get celebration message for streak
     * @param {number} streak - Streak count
     * @returns {string|null} Celebration message
     */
    getStreakMessage(streak) {
        if (STREAK_MESSAGES[streak]) {
            return STREAK_MESSAGES[streak];
        }
        
        if (streak % 10 === 0 && streak > 30) {
            return STREAK_MESSAGES.getMultipleTenMessage(streak);
        }
        
        return null;
    }

    /**
     * Offer streak protection email signup
     */
    offerStreakProtection() {
        // Import email functions dynamically to avoid circular dependencies
        import('./email.js').then(({ offerStreakProtection }) => {
            offerStreakProtection();
        }).catch(error => {
            console.warn('Could not load email module:', error);
        });
    }

    /**
     * Get current streak data
     * @returns {Object} Streak data
     */
    getStreakData() {
        return StreakStorage.getStreakData();
    }

    /**
     * Check if today has an entry
     * @returns {boolean} Has entry today
     */
    hasEntryToday() {
        const today = getCurrentDateString();
        const streakData = this.getStreakData();
        return streakData.writingDays.includes(today);
    }

    /**
     * Get streak statistics
     * @returns {Object} Streak statistics
     */
    getStatistics() {
        const streakData = this.getStreakData();
        return {
            currentStreak: streakData.currentStreak,
            longestStreak: streakData.longestStreak,
            totalDays: streakData.writingDays.length,
            lastWriteDate: streakData.lastWriteDate,
            hasEntryToday: this.hasEntryToday()
        };
    }
}

// Global streak manager instance
let streakManager = null;

/**
 * Get or create streak manager instance
 * @returns {StreakManager} Streak manager instance
 */
export function getStreakManager() {
    if (!streakManager) {
        streakManager = new StreakManager();
    }
    return streakManager;
}

/**
 * Global functions for backward compatibility
 */

/**
 * Update streak display
 */
export function updateStreakDisplay() {
    const manager = getStreakManager();
    manager.updateDisplay();
}

/**
 * Update streak for writing session
 * @param {number} wordCount - Number of words written
 */
export function updateStreak(wordCount) {
    const manager = getStreakManager();
    return manager.updateStreak(wordCount);
}

/**
 * Get streak data
 * @returns {Object} Streak data
 */
export function getStreakData() {
    const manager = getStreakManager();
    return manager.getStreakData();
}

/**
 * Save streak data
 * @param {Object} data - Streak data to save
 */
export function saveStreakData(data) {
    return StreakStorage.saveStreakData(data);
}

/**
 * Celebrate streak milestone
 * @param {number} streak - Streak count
 */
export function celebrateStreak(streak) {
    const manager = getStreakManager();
    manager.celebrateStreak(streak);
}