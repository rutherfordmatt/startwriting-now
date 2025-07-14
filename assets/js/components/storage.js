/**
 * Start Writing Now - Storage Utilities
 * Local storage management and data persistence
 */

import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Generic localStorage wrapper with error handling
 */
export class StorageManager {
    /**
     * Get item from localStorage with fallback
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed value or default
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    }

    /**
     * Set item in localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
            return false;
        }
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Availability status
     */
    static isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
}

/**
 * Writing entries storage management
 */
export class EntriesStorage {
    /**
     * Get all writing entries
     * @returns {Array} Array of entry objects
     */
    static getEntries() {
        return StorageManager.get(STORAGE_KEYS.WRITING_ENTRIES, []);
    }

    /**
     * Save entry to storage
     * @param {string} prompt - The writing prompt
     * @param {string} text - The written content
     * @param {number} wordCount - Number of words
     * @param {string} mode - Writing mode (personal/professional)
     * @returns {Object} The saved entry object
     */
    static saveEntry(prompt, text, wordCount, mode) {
        const entries = this.getEntries();
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            prompt: prompt,
            text: text,
            wordCount: wordCount,
            mode: mode
        };
        
        entries.unshift(entry); // Add to beginning of array
        StorageManager.set(STORAGE_KEYS.WRITING_ENTRIES, entries);
        return entry;
    }

    /**
     * Delete entry by ID
     * @param {number} entryId - ID of entry to delete
     * @returns {boolean} Success status
     */
    static deleteEntry(entryId) {
        const entries = this.getEntries();
        const filteredEntries = entries.filter(e => e.id != entryId);
        return StorageManager.set(STORAGE_KEYS.WRITING_ENTRIES, filteredEntries);
    }

    /**
     * Clear all entries
     * @returns {boolean} Success status
     */
    static clearAllEntries() {
        return StorageManager.remove(STORAGE_KEYS.WRITING_ENTRIES);
    }

    /**
     * Get entry by ID
     * @param {number} entryId - ID of entry to find
     * @returns {Object|null} Entry object or null if not found
     */
    static getEntryById(entryId) {
        const entries = this.getEntries();
        return entries.find(e => e.id == entryId) || null;
    }

    /**
     * Get total word count across all entries
     * @returns {number} Total word count
     */
    static getTotalWordCount() {
        const entries = this.getEntries();
        return entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    }
}

/**
 * Streak data storage management
 */
export class StreakStorage {
    /**
     * Get streak data with default structure
     * @returns {Object} Streak data object
     */
    static getStreakData() {
        const defaultData = {
            currentStreak: 0,
            longestStreak: 0,
            lastWriteDate: null,
            writingDays: []
        };
        
        return StorageManager.get(STORAGE_KEYS.WRITING_STREAK, defaultData);
    }

    /**
     * Save streak data
     * @param {Object} data - Streak data object
     * @returns {boolean} Success status
     */
    static saveStreakData(data) {
        return StorageManager.set(STORAGE_KEYS.WRITING_STREAK, data);
    }

    /**
     * Add writing day and update streak
     * @param {string} date - Date string (YYYY-MM-DD format)
     * @returns {Object} Updated streak data
     */
    static addWritingDay(date) {
        const streakData = this.getStreakData();
        
        // Don't count multiple entries on the same day
        if (streakData.writingDays.includes(date)) {
            return streakData;
        }
        
        // Add today to writing days
        streakData.writingDays.push(date);
        streakData.lastWriteDate = date;
        
        // Calculate current streak
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
        
        // Update longest streak
        if (currentStreak > streakData.longestStreak) {
            streakData.longestStreak = currentStreak;
        }
        
        this.saveStreakData(streakData);
        return streakData;
    }
}

/**
 * App preferences storage management
 */
export class PreferencesStorage {
    /**
     * Get dark mode preference
     * @returns {boolean} Dark mode enabled status
     */
    static getDarkMode() {
        return StorageManager.get(STORAGE_KEYS.DARK_MODE, null);
    }

    /**
     * Set dark mode preference
     * @param {boolean} enabled - Dark mode enabled status
     * @returns {boolean} Success status
     */
    static setDarkMode(enabled) {
        return StorageManager.set(STORAGE_KEYS.DARK_MODE, enabled);
    }

    /**
     * Get recent prompts list
     * @returns {Array} Array of recent prompt strings
     */
    static getRecentPrompts() {
        return StorageManager.get(STORAGE_KEYS.RECENT_PROMPTS, []);
    }

    /**
     * Set recent prompts list
     * @param {Array} prompts - Array of prompt strings
     * @returns {boolean} Success status
     */
    static setRecentPrompts(prompts) {
        return StorageManager.set(STORAGE_KEYS.RECENT_PROMPTS, prompts);
    }

    /**
     * Get email preferences
     * @returns {Object} Email preference data
     */
    static getEmailPreferences() {
        return {
            backupDeclined: StorageManager.get(STORAGE_KEYS.EMAIL_BACKUP_DECLINED, false),
            lastBackupOffer: StorageManager.get(STORAGE_KEYS.LAST_EMAIL_BACKUP_OFFER, 0),
            streakEmailOffered: StorageManager.get(STORAGE_KEYS.STREAK_EMAIL_OFFERED, false)
        };
    }

    /**
     * Set email backup declined status
     * @param {boolean} declined - Declined status
     * @returns {boolean} Success status
     */
    static setEmailBackupDeclined(declined) {
        return StorageManager.set(STORAGE_KEYS.EMAIL_BACKUP_DECLINED, declined);
    }

    /**
     * Set last email backup offer timestamp
     * @param {number} timestamp - Timestamp
     * @returns {boolean} Success status
     */
    static setLastEmailBackupOffer(timestamp) {
        return StorageManager.set(STORAGE_KEYS.LAST_EMAIL_BACKUP_OFFER, timestamp);
    }

    /**
     * Set streak email offered status
     * @param {boolean} offered - Offered status
     * @returns {boolean} Success status
     */
    static setStreakEmailOffered(offered) {
        return StorageManager.set(STORAGE_KEYS.STREAK_EMAIL_OFFERED, offered);
    }
}