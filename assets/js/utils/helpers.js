/**
 * Start Writing Now - Helper Utilities
 * General utility functions used across the application
 */

/**
 * Format timer display (minutes:seconds)
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Count words in text
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
export function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 200) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date provided to formatDate:', date);
            return 'Invalid Date';
        }
        
        return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.warn('Error formatting date:', error);
        return 'Invalid Date';
    }
}

/**
 * Get current date string (YYYY-MM-DD)
 * @returns {string} Date string
 */
export function getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get time-based category for smart prompts
 * @returns {string|null} Time category
 */
export function getTimeCategory() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Morning/Evening
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 18 || hour < 5) return 'evening';
    
    // Day of week
    if (day === 1) return 'monday'; // Monday
    if (day === 5) return 'friday'; // Friday
    if (day === 0 || day === 6) return 'weekend'; // Weekend
    
    return null;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate filename for downloads
 * @param {string} prefix - Filename prefix
 * @param {Date} date - Date for filename (optional)
 * @returns {string} Generated filename
 */
export function generateFilename(prefix, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return `${prefix}-${dateStr}.txt`;
}

/**
 * Format entry for export
 * @param {Object} entry - Entry object
 * @param {boolean} includeFooter - Whether to include footer
 * @returns {string} Formatted entry text
 */
export function formatEntryForExport(entry, includeFooter = true) {
    const timestamp = formatDate(entry.date);
    let formatted = `Start Writing Now - Journal Entry
Date: ${timestamp}
Prompt: ${entry.prompt || 'No prompt'}

${entry.text || ''}

---`;

    if (includeFooter) {
        formatted += '\nstartwriting.now';
    }

    return formatted;
}

/**
 * Copy text to clipboard with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('Clipboard API failed, using fallback:', error);
        }
    }
    
    // Fallback method
    return fallbackCopyToClipboard(text);
}

/**
 * Fallback clipboard copy method
 * @param {string} text - Text to copy
 * @returns {boolean} Success status
 */
function fallbackCopyToClipboard(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    } catch (error) {
        console.warn('Fallback clipboard copy failed:', error);
        return false;
    }
}

/**
 * Download text as file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadTextFile(content, filename, mimeType = 'text/plain') {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.warn('File download failed:', error);
        return false;
    }
}

/**
 * Check if email address is valid (basic validation)
 * @param {string} email - Email address
 * @returns {boolean} Validity status
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return email.includes('@') && email.includes('.');
}

/**
 * Open email client with pre-filled content
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 */
export function openEmailClient(subject, body) {
    try {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
    } catch (error) {
        console.warn('Failed to open email client:', error);
    }
}

/**
 * Submit form data to Netlify
 * @param {string} formName - Form name
 * @param {Object} data - Form data object
 * @returns {Promise<boolean>} Success status
 */
export async function submitNetlifyForm(formName, data) {
    try {
        const formData = new FormData();
        formData.append('form-name', formName);
        
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        const response = await fetch('/', {
            method: 'POST',
            body: formData
        });
        
        return response.ok;
    } catch (error) {
        console.warn('Netlify form submission failed:', error);
        return false;
    }
}