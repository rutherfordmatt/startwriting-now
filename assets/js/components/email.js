/**
 * Start Writing Now - Email Component
 * Email backup and newsletter functionality
 */

import { APP_CONFIG, MESSAGES } from '../config/constants.js';
import { PreferencesStorage } from './storage.js';
import { isValidEmail, openEmailClient, submitNetlifyForm } from '../utils/helpers.js';

/**
 * Email management class
 */
export class EmailManager {
    constructor() {
        // Email offering is opt-in and respectful of user preferences
    }

    /**
     * Offer email backup for entry
     * @param {string} entryText - Entry text to backup
     */
    offerEmailBackup(entryText) {
        const preferences = PreferencesStorage.getEmailPreferences();
        
        // Only offer if not previously declined
        if (preferences.backupDeclined) {
            return;
        }
        
        // Don't offer too frequently
        const now = new Date().getTime();
        if (preferences.lastBackupOffer && 
            (now - preferences.lastBackupOffer) < APP_CONFIG.EMAIL_OFFER_COOLDOWN) {
            return;
        }
        
        if (confirm(MESSAGES.EMAIL_BACKUP_OFFER)) {
            this.sendEmailBackup(entryText);
            
            // Ask for newsletter signup after email
            setTimeout(() => {
                this.collectEmailForNewsletter('backup', entryText.substring(0, 100));
            }, 3000);
        } else {
            PreferencesStorage.setEmailBackupDeclined(true);
        }
        
        PreferencesStorage.setLastEmailBackupOffer(now);
    }

    /**
     * Send email backup of entry
     * @param {string} entryText - Entry text to send
     */
    sendEmailBackup(entryText) {
        const subject = 'My Writing Entry - ' + new Date().toDateString();
        openEmailClient(subject, entryText);
    }

    /**
     * Offer streak protection email signup
     */
    offerStreakProtection() {
        const preferences = PreferencesStorage.getEmailPreferences();
        
        // Only offer once
        if (preferences.streakEmailOffered) {
            return;
        }
        
        if (confirm(MESSAGES.STREAK_PROTECTION_OFFER)) {
            this.collectEmailForNewsletter('streak', '7-day streak protection');
        }
        
        PreferencesStorage.setStreakEmailOffered(true);
    }

    /**
     * Collect email for newsletter signup
     * @param {string} source - Signup source ('backup' or 'streak')
     * @param {string} preview - Preview text
     */
    async collectEmailForNewsletter(source, preview) {
        const promptText = source === 'backup' 
            ? 'Enter your email for entry backup and weekly writing prompts:'
            : 'Enter your email for weekly writing prompts:';
            
        const email = prompt(promptText);
        
        if (email && isValidEmail(email)) {
            const success = await this.submitNewsletterSignup(email, source, preview);
            
            if (success) {
                alert(MESSAGES.NEWSLETTER_THANKS);
            } else {
                // Still show thanks message even if submission failed
                alert(MESSAGES.NEWSLETTER_THANKS);
            }
        }
    }

    /**
     * Submit newsletter signup to Netlify
     * @param {string} email - Email address
     * @param {string} source - Signup source
     * @param {string} preview - Preview text
     * @returns {Promise<boolean>} Success status
     */
    async submitNewsletterSignup(email, source, preview) {
        try {
            return await submitNetlifyForm('newsletter-signup', {
                email: email,
                source: source,
                entry_preview: preview
            });
        } catch (error) {
            console.warn('Newsletter signup failed:', error);
            return false;
        }
    }

    /**
     * Check if email offers should be shown
     * @returns {boolean} Should show offers
     */
    shouldShowEmailOffers() {
        const preferences = PreferencesStorage.getEmailPreferences();
        return !preferences.backupDeclined;
    }

    /**
     * Reset email preferences (for testing/debugging)
     */
    resetEmailPreferences() {
        PreferencesStorage.setEmailBackupDeclined(false);
        PreferencesStorage.setLastEmailBackupOffer(0);
        PreferencesStorage.setStreakEmailOffered(false);
    }
}

// Global email manager instance
let emailManager = null;

/**
 * Get or create email manager instance
 * @returns {EmailManager} Email manager instance
 */
export function getEmailManager() {
    if (!emailManager) {
        emailManager = new EmailManager();
    }
    return emailManager;
}

/**
 * Global functions for backward compatibility
 */

/**
 * Offer email backup for entry
 * @param {string} entryText - Entry text to backup
 */
export function offerEmailBackup(entryText) {
    const manager = getEmailManager();
    manager.offerEmailBackup(entryText);
}

/**
 * Offer streak protection email signup
 */
export function offerStreakProtection() {
    const manager = getEmailManager();
    manager.offerStreakProtection();
}

/**
 * Collect email for newsletter
 * @param {string} source - Signup source
 * @param {string} preview - Preview text
 */
export function collectEmailForNewsletter(source, preview) {
    const manager = getEmailManager();
    return manager.collectEmailForNewsletter(source, preview);
}