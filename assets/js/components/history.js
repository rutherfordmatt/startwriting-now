/**
 * Start Writing Now - History Component
 * Entry history management and display
 */

import { APP_CONFIG, MODE_EMOJIS, MESSAGES } from '../config/constants.js';
import { EntriesStorage } from './storage.js';
import { formatDate, escapeHtml, truncateText, debounce, formatEntryForExport, downloadTextFile, generateFilename, copyToClipboard } from '../utils/helpers.js';

/**
 * History management class
 */
export class HistoryManager {
    constructor() {
        this.container = document.getElementById('entriesContainer');
        this.statsElement = document.getElementById('historyStats');
        this.searchElement = document.getElementById('historySearch');
        
        this.lastRenderedEntries = null;
        this.searchTimeout = null;
        
        this.bindElements();
        this.setupSearch();
    }

    /**
     * Bind DOM elements and event handlers
     */
    bindElements() {
        if (!this.container) {
            console.warn('Entries container element not found');
        }
        
        if (!this.statsElement) {
            console.warn('History stats element not found');
        }
        
        if (!this.searchElement) {
            console.warn('History search element not found');
        }
    }

    /**
     * Setup search functionality with debouncing
     */
    setupSearch() {
        if (this.searchElement) {
            const debouncedSearch = debounce(() => {
                this.performSearch();
            }, APP_CONFIG.SEARCH_DEBOUNCE_DELAY);
            
            this.searchElement.addEventListener('input', debouncedSearch);
        }
    }

    /**
     * Save entry to history
     * @param {string} prompt - Writing prompt
     * @param {string} text - Entry text
     * @param {number} wordCount - Word count
     * @param {string} mode - Writing mode
     * @returns {Object} Saved entry
     */
    saveEntry(prompt, text, wordCount, mode) {
        const entry = EntriesStorage.saveEntry(prompt, text, wordCount, mode);
        this.updateDisplay();
        return entry;
    }

    /**
     * Update history display
     */
    updateDisplay() {
        if (!this.container || !this.statsElement) return;

        const entries = EntriesStorage.getEntries();
        
        // Performance optimization: check if entries have changed
        const entriesHash = JSON.stringify(entries.map(e => ({ id: e.id, date: e.date })));
        if (this.lastRenderedEntries === entriesHash && this.container.children.length > 0) {
            return; // No need to re-render
        }
        this.lastRenderedEntries = entriesHash;

        // Update stats
        this.updateStats(entries);

        // Render entries
        if (entries.length === 0) {
            this.container.innerHTML = '<div class="no-entries">No entries yet. Start writing to see your history!</div>';
            return;
        }

        this.renderEntries(entries);
    }

    /**
     * Update statistics display
     * @param {Array} entries - Array of entries
     */
    updateStats(entries) {
        if (!this.statsElement) return;

        const totalWords = EntriesStorage.getTotalWordCount();
        this.statsElement.textContent = `${entries.length} entries • ${totalWords} total words`;
    }

    /**
     * Render entries in the container
     * @param {Array} entries - Array of entries
     */
    renderEntries(entries) {
        if (!this.container) return;

        const entriesHTML = entries.map(entry => this.renderEntry(entry))
            .filter(html => html)
            .join('');
        
        this.container.innerHTML = entriesHTML;
    }

    /**
     * Render single entry
     * @param {Object} entry - Entry object
     * @returns {string} HTML string
     */
    renderEntry(entry) {
        try {
            const date = new Date(entry.date);
            
            // Validate date
            if (isNaN(date.getTime())) {
                console.warn('Invalid date for entry:', entry.id);
                return '';
            }
            
            const formattedDate = formatDate(date);
            const safeText = (entry.text || '').toString();
            const preview = truncateText(safeText, 200);
            const escapedPrompt = escapeHtml(entry.prompt || 'No prompt');
            const escapedPreview = escapeHtml(preview);
            
            const modeDisplay = this.getModeDisplay(entry.mode);
            
            return `
                <div class="entry-item" data-entry-id="${entry.id}">
                    <div class="entry-header">
                        <div class="entry-date">${formattedDate}</div>
                        <div class="entry-meta">
                            <span>${entry.wordCount || 0} words</span>
                            ${modeDisplay}
                        </div>
                    </div>
                    <div class="entry-prompt">${escapedPrompt}</div>
                    <div class="entry-text">${escapedPreview}</div>
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
    }

    /**
     * Get mode display for entry
     * @param {string} mode - Entry mode
     * @returns {string} Mode display HTML
     */
    getModeDisplay(mode) {
        if (mode && MODE_EMOJIS[mode]) {
            return `<span>${MODE_EMOJIS[mode]} ${mode}</span>`;
        }
        return '<span>💭 personal</span>';
    }

    /**
     * Perform search on entries
     */
    performSearch() {
        if (!this.searchElement || !this.container || !this.statsElement) return;

        const searchTerm = this.searchElement.value.toLowerCase();
        const entries = this.container.querySelectorAll('.entry-item');
        let visibleCount = 0;
        
        entries.forEach(entry => {
            const text = entry.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            entry.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        });
        
        // Update stats to show filtered results
        if (searchTerm) {
            const totalEntries = entries.length;
            this.statsElement.textContent = `${visibleCount} of ${totalEntries} entries shown`;
        } else {
            // Reset to original stats
            const allEntries = EntriesStorage.getEntries();
            const totalWords = EntriesStorage.getTotalWordCount();
            this.statsElement.textContent = `${allEntries.length} entries • ${totalWords} total words`;
        }
    }

    /**
     * Copy entry to clipboard
     * @param {string} entryId - Entry ID
     * @returns {Promise<boolean>} Success status
     */
    async copyEntry(entryId) {
        const entry = EntriesStorage.getEntryById(entryId);
        if (!entry) return false;
        
        const formattedEntry = formatEntryForExport(entry);
        const success = await copyToClipboard(formattedEntry);
        
        if (success) {
            alert('Entry copied to clipboard! 📋');
        } else {
            alert('Unable to copy to clipboard.');
        }
        
        return success;
    }

    /**
     * Download entry as file
     * @param {string} entryId - Entry ID
     * @returns {boolean} Success status
     */
    downloadEntry(entryId) {
        const entry = EntriesStorage.getEntryById(entryId);
        if (!entry) return false;
        
        const formattedEntry = formatEntryForExport(entry);
        const filename = generateFilename('journal-entry', new Date(entry.date));
        
        return downloadTextFile(formattedEntry, filename);
    }

    /**
     * Delete entry
     * @param {string} entryId - Entry ID
     * @returns {boolean} Success status
     */
    deleteEntry(entryId) {
        if (!confirm(MESSAGES.DELETE_CONFIRM)) {
            return false;
        }
        
        const success = EntriesStorage.deleteEntry(entryId);
        if (success) {
            this.updateDisplay();
        }
        
        return success;
    }

    /**
     * Export all entries
     * @returns {boolean} Success status
     */
    exportAllEntries() {
        const entries = EntriesStorage.getEntries();
        if (entries.length === 0) {
            alert(MESSAGES.NO_ENTRIES_EXPORT);
            return false;
        }
        
        const allEntries = entries.map(entry => formatEntryForExport(entry, false)).join('\n\n');
        
        const finalContent = `${allEntries}

Complete Journal Export from startwriting.now
Total Entries: ${entries.length}
Total Words: ${EntriesStorage.getTotalWordCount()}
Exported: ${new Date().toLocaleString()}`;
        
        const filename = generateFilename('all-journal-entries');
        const success = downloadTextFile(finalContent, filename);
        
        if (success) {
            alert(`Exported ${entries.length} entries! 📥`);
        }
        
        return success;
    }

    /**
     * Clear all entries
     * @returns {boolean} Success status
     */
    clearAllEntries() {
        if (!confirm(MESSAGES.CLEAR_ALL_CONFIRM)) {
            return false;
        }
        
        if (!confirm(MESSAGES.CLEAR_ALL_FINAL_CONFIRM)) {
            return false;
        }
        
        const success = EntriesStorage.clearAllEntries();
        if (success) {
            this.updateDisplay();
            alert(MESSAGES.ALL_ENTRIES_DELETED);
        }
        
        return success;
    }

    /**
     * Filter entries (for external search)
     */
    filterEntries() {
        this.performSearch();
    }
}

// Global history manager instance
let historyManager = null;

/**
 * Get or create history manager instance
 * @returns {HistoryManager} History manager instance
 */
export function getHistoryManager() {
    if (!historyManager) {
        historyManager = new HistoryManager();
    }
    return historyManager;
}

/**
 * Global functions for backward compatibility
 */

/**
 * Update history display
 */
export function updateHistoryDisplay() {
    const manager = getHistoryManager();
    manager.updateDisplay();
}

/**
 * Save entry to history
 * @param {string} prompt - Writing prompt
 * @param {string} text - Entry text
 * @param {number} wordCount - Word count
 * @param {string} mode - Writing mode
 */
export function saveEntryToHistory(prompt, text, wordCount, mode) {
    const manager = getHistoryManager();
    return manager.saveEntry(prompt, text, wordCount, mode);
}

/**
 * Filter entries based on search
 */
export function filterEntries() {
    const manager = getHistoryManager();
    manager.filterEntries();
}

/**
 * Copy entry to clipboard
 * @param {string} entryId - Entry ID
 */
export async function copyEntry(entryId) {
    const manager = getHistoryManager();
    return await manager.copyEntry(entryId);
}

/**
 * Download entry as file
 * @param {string} entryId - Entry ID
 */
export function downloadEntry(entryId) {
    const manager = getHistoryManager();
    return manager.downloadEntry(entryId);
}

/**
 * Delete entry
 * @param {string} entryId - Entry ID
 */
export function deleteEntry(entryId) {
    const manager = getHistoryManager();
    return manager.deleteEntry(entryId);
}

/**
 * Export all entries
 */
export function exportAllEntries() {
    const manager = getHistoryManager();
    return manager.exportAllEntries();
}

/**
 * Clear all entries
 */
export function clearAllHistory() {
    const manager = getHistoryManager();
    return manager.clearAllEntries();
}