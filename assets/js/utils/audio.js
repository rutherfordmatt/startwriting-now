/**
 * Start Writing Now - Audio Utilities
 * Audio management and chime functionality
 */

import { AUDIO_CONFIG } from '../config/constants.js';

/**
 * Audio manager for handling Web Audio API
 */
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isSupported = this.checkSupport();
    }

    /**
     * Check if Web Audio API is supported
     * @returns {boolean} Support status
     */
    checkSupport() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    /**
     * Initialize audio context
     * @returns {Promise<boolean>} Success status
     */
    async initAudioContext() {
        if (!this.isSupported) {
            console.warn('Web Audio API not supported');
            return false;
        }

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Handle suspended context (common in modern browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            return this.audioContext.state === 'running';
        } catch (error) {
            console.warn('Failed to initialize audio context:', error);
            return false;
        }
    }

    /**
     * Create a single note
     * @param {number} frequency - Note frequency in Hz
     * @param {number} startTime - Start time in audio context time
     * @param {number} duration - Duration in seconds
     * @returns {boolean} Success status
     */
    createNote(frequency, startTime, duration = AUDIO_CONFIG.CHIME_DURATION) {
        if (!this.audioContext) return false;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';
            
            // Set volume envelope for a soft chime
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(AUDIO_CONFIG.CHIME_VOLUME, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
            
            return true;
        } catch (error) {
            console.warn(`Failed to create note ${frequency}Hz:`, error);
            return false;
        }
    }

    /**
     * Play completion chime
     * @returns {Promise<boolean>} Success status
     */
    async playChime() {
        if (!this.isSupported) {
            console.warn('Audio not supported, skipping chime');
            return false;
        }

        const success = await this.initAudioContext();
        if (!success) {
            console.warn('Could not initialize audio context');
            return false;
        }

        try {
            const currentTime = this.audioContext.currentTime;
            
            // Create three notes for a pleasant chime
            AUDIO_CONFIG.CHIME_FREQUENCIES.forEach((frequency, index) => {
                const startTime = currentTime + index * AUDIO_CONFIG.NOTE_DELAY;
                this.createNote(frequency, startTime);
            });
            
            return true;
        } catch (error) {
            console.warn('Failed to play chime:', error);
            return false;
        }
    }

    /**
     * Cleanup audio context
     */
    cleanup() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
                this.audioContext = null;
            } catch (error) {
                console.warn('Error cleaning up audio context:', error);
            }
        }
    }
}

// Global audio manager instance
let audioManager = null;

/**
 * Get or create audio manager instance
 * @returns {AudioManager} Audio manager instance
 */
export function getAudioManager() {
    if (!audioManager) {
        audioManager = new AudioManager();
    }
    return audioManager;
}

/**
 * Play timer completion chime
 * @returns {Promise<boolean>} Success status
 */
export async function playTimerChime() {
    const manager = getAudioManager();
    return await manager.playChime();
}

/**
 * Cleanup audio resources
 */
export function cleanupAudio() {
    if (audioManager) {
        audioManager.cleanup();
        audioManager = null;
    }
}