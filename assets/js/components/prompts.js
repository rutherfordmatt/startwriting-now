/**
 * Start Writing Now - Prompts Component
 * Smart prompt selection and management
 */

import { APP_CONFIG, FALLBACK_PROMPTS, PATHS, MESSAGES } from '../config/constants.js';
import { PreferencesStorage } from './storage.js';
import { getTimeCategory } from '../utils/helpers.js';

/**
 * Prompts management class
 */
export class PromptsManager {
    constructor() {
        this.externalPrompts = null;
        this.promptsLoaded = false;
        this.currentMode = 'personal';
        this.lastUsedPrompts = [];
        
        this.loadRecentPrompts();
    }

    /**
     * Load external prompts with fallback
     * @returns {Promise<boolean>} Success status
     */
    async loadExternalPrompts() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.PROMPTS_TIMEOUT);
            
            const response = await fetch(PATHS.PROMPTS_JSON, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.externalPrompts = await response.json();
                
                // Validate prompt structure
                if (!this.externalPrompts.prompts || 
                    !this.externalPrompts.prompts.life || 
                    !this.externalPrompts.prompts.career) {
                    throw new Error('Invalid prompt data structure');
                }
                
                this.promptsLoaded = true;
                console.log('External prompts loaded successfully');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.warn('Failed to load external prompts:', error.message);
            this.externalPrompts = { prompts: FALLBACK_PROMPTS };
            this.promptsLoaded = true;
            
            // Store failure for debugging
            PreferencesStorage.set('lastPromptLoadError', {
                error: error.message,
                timestamp: Date.now()
            });
            
            return false;
        }
    }

    /**
     * Get prompts with fallback
     * @returns {Object} Prompts object
     */
    getPrompts() {
        return this.externalPrompts ? this.externalPrompts.prompts : FALLBACK_PROMPTS;
    }

    /**
     * Load recent prompts from storage
     */
    loadRecentPrompts() {
        this.lastUsedPrompts = PreferencesStorage.getRecentPrompts();
    }

    /**
     * Track used prompt
     * @param {string} prompt - Prompt text
     */
    trackUsedPrompt(prompt) {
        this.lastUsedPrompts.unshift(prompt);
        
        // Keep only last N prompts to avoid
        if (this.lastUsedPrompts.length > APP_CONFIG.MAX_RECENT_PROMPTS) {
            this.lastUsedPrompts = this.lastUsedPrompts.slice(0, APP_CONFIG.MAX_RECENT_PROMPTS);
        }
        
        PreferencesStorage.setRecentPrompts(this.lastUsedPrompts);
    }

    /**
     * Filter out recently used prompts
     * @param {Array} promptArray - Array of prompts
     * @returns {Array} Filtered prompts
     */
    filterRecentPrompts(promptArray) {
        if (this.lastUsedPrompts.length === 0) return promptArray;
        
        const filtered = promptArray.filter(prompt => !this.lastUsedPrompts.includes(prompt));
        return filtered.length > 0 ? filtered : promptArray;
    }

    /**
     * Get seasonal prompts
     * @returns {Array} Seasonal prompts
     */
    getSeasonalPrompts() {
        const prompts = this.getPrompts();
        if (prompts.seasonal && prompts.seasonal.current) {
            return prompts.seasonal[prompts.seasonal.current] || [];
        }
        return [];
    }

    /**
     * Get mood-aware prompts based on time and mode
     * @returns {Array} Mood-aware prompts
     */
    getMoodAwarePrompts() {
        const prompts = this.getPrompts();
        const currentHour = new Date().getHours();
        let smartMoodPrompts = [];
        
        if (this.currentMode === 'personal') {
            if (currentHour >= 18 || currentHour < 6) {
                // Evening/night - reflective and grateful prompts
                smartMoodPrompts = [
                    ...(prompts.moods?.reflective || []).slice(0, 3),
                    ...(prompts.moods?.grateful || []).slice(0, 3)
                ];
            } else if (currentHour >= 6 && currentHour < 12) {
                // Morning - energized and creative prompts
                smartMoodPrompts = [
                    ...(prompts.moods?.energized || []).slice(0, 3),
                    ...(prompts.moods?.creative || []).slice(0, 2)
                ];
            } else {
                // Afternoon - mix of reflective and creative
                smartMoodPrompts = [
                    ...(prompts.moods?.reflective || []).slice(0, 2),
                    ...(prompts.moods?.creative || []).slice(0, 2)
                ];
            }
        } else {
            // Professional mode - always energized and focused
            smartMoodPrompts = [
                ...(prompts.moods?.energized || []).slice(0, 3)
            ];
            
            // Add struggling support prompts on Mondays
            const today = new Date().getDay();
            if (today === 1) { // Monday
                smartMoodPrompts = [
                    ...smartMoodPrompts,
                    ...(prompts.moods?.struggling || []).slice(0, 2)
                ];
            }
        }
        
        return smartMoodPrompts;
    }

    /**
     * Set current mode
     * @param {string} mode - Mode ('personal' or 'career')
     */
    setMode(mode) {
        this.currentMode = mode === 'career' ? 'professional' : 'personal';
    }

    /**
     * Get current mode
     * @returns {string} Current mode
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Generate smart prompt using ultra-intelligent selection
     * @returns {string} Selected prompt
     */
    generateSmartPrompt() {
        if (!this.promptsLoaded) {
            return MESSAGES.LOADING_PROMPTS;
        }

        const prompts = this.getPrompts();
        let promptArray = [];
        
        // Step 1: Get base prompts based on mode
        if (this.currentMode === 'professional') {
            promptArray = [...(prompts.career || FALLBACK_PROMPTS.career)];
        } else {
            promptArray = [...(prompts.life || FALLBACK_PROMPTS.life)];
        }

        // Step 2: Add time-aware intelligence
        const timeCategory = getTimeCategory();
        if (timeCategory && prompts.timeAware && prompts.timeAware[timeCategory]) {
            // Mix in 30% time-relevant prompts
            const timePrompts = prompts.timeAware[timeCategory];
            const mixCount = Math.floor(timePrompts.length * 0.3);
            promptArray = [...promptArray, ...timePrompts.slice(0, mixCount)];
        }

        // Step 3: Add mood-aware intelligence
        const moodPrompts = this.getMoodAwarePrompts();
        promptArray = [...promptArray, ...moodPrompts];

        // Step 4: Add seasonal intelligence
        const seasonalPrompts = this.getSeasonalPrompts();
        if (seasonalPrompts.length > 0) {
            promptArray = [...promptArray, ...seasonalPrompts.slice(0, 3)];
        }

        // Step 5: Filter out recently used prompts
        promptArray = this.filterRecentPrompts(promptArray);

        // Step 6: Final fallback
        if (promptArray.length === 0) {
            promptArray = this.currentMode === 'professional' ? 
                FALLBACK_PROMPTS.career : FALLBACK_PROMPTS.life;
        }

        // Select and track prompt
        const randomIndex = Math.floor(Math.random() * promptArray.length);
        const selectedPrompt = promptArray[randomIndex];
        
        this.trackUsedPrompt(selectedPrompt);
        return selectedPrompt;
    }

    /**
     * Display prompt in UI
     * @param {string} prompt - Prompt to display (optional, generates new if not provided)
     */
    displayPrompt(prompt = null) {
        const promptElement = document.getElementById('currentPrompt');
        if (!promptElement) {
            console.warn('Prompt display element not found');
            return;
        }

        const promptText = prompt || this.generateSmartPrompt();
        promptElement.textContent = promptText;
    }

    /**
     * Get current displayed prompt
     * @returns {string} Current prompt text
     */
    getCurrentPrompt() {
        const promptElement = document.getElementById('currentPrompt');
        return promptElement ? promptElement.textContent : '';
    }

    /**
     * Initialize prompts system
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        const success = await this.loadExternalPrompts();
        this.displayPrompt();
        return success;
    }
}

// Global prompts manager instance
let promptsManager = null;

/**
 * Get or create prompts manager instance
 * @returns {PromptsManager} Prompts manager instance
 */
export function getPromptsManager() {
    if (!promptsManager) {
        promptsManager = new PromptsManager();
    }
    return promptsManager;
}

/**
 * Global functions for backward compatibility
 */

/**
 * Display smart prompt
 */
export function displaySmartPrompt() {
    const manager = getPromptsManager();
    manager.displayPrompt();
}

/**
 * Generate new prompt
 */
export function newPrompt() {
    displaySmartPrompt();
}

/**
 * Set writing mode
 * @param {string} mode - Mode to set
 */
export function setMode(mode) {
    const manager = getPromptsManager();
    manager.setMode(mode);
    
    // Update UI
    document.querySelectorAll('.toggle-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
    
    // Get new smart prompt
    displaySmartPrompt();
}

/**
 * Get current prompt text
 * @returns {string} Current prompt
 */
export function getCurrentPrompt() {
    const manager = getPromptsManager();
    return manager.getCurrentPrompt();
}

/**
 * Initialize prompts system
 * @returns {Promise<boolean>} Success status
 */
export async function initializePrompts() {
    const manager = getPromptsManager();
    return await manager.initialize();
}