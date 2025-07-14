/**
 * Start Writing Now - Actions Component
 * Copy, save, and export actions
 */

import { APP_CONFIG, MESSAGES } from '../config/constants.js';
import { formatEntryForExport, downloadTextFile, generateFilename, copyToClipboard } from '../utils/helpers.js';
import { getCurrentPrompt } from './prompts.js';
import { validateWritingInput } from './ui.js';
import { updateStreak } from './streak.js';
import { saveEntryToHistory } from './history.js';
import { offerEmailBackup } from './email.js';

/**
 * Actions management class
 */
export class ActionsManager {
    constructor() {
        this.copyButton = document.getElementById('copyBtn');
        this.saveButton = document.getElementById('saveBtn');
        
        if (!this.copyButton) {
            console.warn('Copy button not found');
        }
        
        if (!this.saveButton) {
            console.warn('Save button not found');
        }
    }

    /**
     * Copy entry to clipboard
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard() {
        const validation = validateWritingInput();
        
        if (!validation.valid) {
            alert(MESSAGES.NO_TEXT_COPY);
            return false;
        }

        const prompt = getCurrentPrompt();
        const { text, wordCount } = validation;
        
        // Update streak and save to history if qualifying
        if (wordCount >= APP_CONFIG.MIN_WORDS_FOR_STREAK) {
            updateStreak(wordCount);
            saveEntryToHistory(prompt, text, wordCount, this.getCurrentMode());
        }
        
        // Create formatted entry
        const entry = {
            date: new Date().toISOString(),
            prompt: prompt,
            text: text
        };
        
        const formattedEntry = formatEntryForExport(entry);
        
        // Copy to clipboard
        const success = await copyToClipboard(formattedEntry);
        
        if (success) {
            const message = wordCount >= APP_CONFIG.MIN_WORDS_FOR_STREAK ? 
                MESSAGES.ENTRY_COPIED : 
                MESSAGES.ENTRY_COPIED_SHORT;
            alert(message);
            
            // Offer email backup after successful copy
            setTimeout(() => {
                offerEmailBackup(formattedEntry);
            }, 1500);
        } else {
            alert(MESSAGES.CLIPBOARD_FALLBACK);
        }
        
        return success;
    }

    /**
     * Save entry as download
     * @returns {boolean} Success status
     */
    saveEntry() {
        const validation = validateWritingInput();
        
        if (!validation.valid) {
            alert(MESSAGES.NO_TEXT_DOWNLOAD);
            return false;
        }

        const prompt = getCurrentPrompt();
        const { text, wordCount } = validation;
        
        // Update streak and save to history if qualifying
        if (wordCount >= APP_CONFIG.MIN_WORDS_FOR_STREAK) {
            updateStreak(wordCount);
            saveEntryToHistory(prompt, text, wordCount, this.getCurrentMode());
        }
        
        // Create formatted entry
        const entry = {
            date: new Date().toISOString(),
            prompt: prompt,
            text: text
        };
        
        const formattedEntry = formatEntryForExport(entry);
        const filename = generateFilename('journal-entry');
        
        // Download file
        const success = downloadTextFile(formattedEntry, filename);
        
        if (success) {
            const message = wordCount >= APP_CONFIG.MIN_WORDS_FOR_STREAK ? 
                MESSAGES.ENTRY_DOWNLOADED : 
                MESSAGES.ENTRY_DOWNLOADED_SHORT;
            alert(message);
            
            // Offer email backup after successful download
            setTimeout(() => {
                offerEmailBackup(formattedEntry);
            }, 1500);
        }
        
        return success;
    }

    /**
     * Get current writing mode
     * @returns {string} Current mode
     */
    getCurrentMode() {
        // Import prompts manager to get current mode
        return import('./prompts.js').then(({ getPromptsManager }) => {
            const manager = getPromptsManager();
            return manager.getMode();
        }).catch(() => 'personal');
    }

    /**
     * Fallback copy method for older browsers
     * @param {string} text - Text to copy
     * @param {number} wordCount - Word count
     */
    fallbackCopyToClipboard(text, wordCount) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (success) {
                const message = wordCount >= APP_CONFIG.MIN_WORDS_FOR_STREAK ? 
                    MESSAGES.ENTRY_COPIED : 
                    MESSAGES.ENTRY_COPIED_SHORT;
                alert(message);
                
                // Offer email backup after successful copy
                setTimeout(() => {
                    offerEmailBackup(text);
                }, 1500);
            } else {
                alert(MESSAGES.CLIPBOARD_FALLBACK);
            }
            
            return success;
        } catch (error) {
            document.body.removeChild(textArea);
            alert(MESSAGES.CLIPBOARD_FALLBACK);
            return false;
        }
    }
}

// Global actions manager instance
let actionsManager = null;

/**
 * Get or create actions manager instance
 * @returns {ActionsManager} Actions manager instance
 */
export function getActionsManager() {
    if (!actionsManager) {
        actionsManager = new ActionsManager();
    }
    return actionsManager;
}

/**
 * Global functions for backward compatibility
 */

/**
 * Copy entry to clipboard
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard() {
    const manager = getActionsManager();
    return await manager.copyToClipboard();
}

/**
 * Save entry as download
 * @returns {boolean} Success status
 */
export function saveEntry() {
    const manager = getActionsManager();
    return manager.saveEntry();
}

/**
 * Fallback copy method
 * @param {string} text - Text to copy
 * @param {number} wordCount - Word count
 */
export function fallbackCopyToClipboard(text, wordCount) {
    const manager = getActionsManager();
    return manager.fallbackCopyToClipboard(text, wordCount);
}