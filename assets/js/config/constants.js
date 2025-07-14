/**
 * Start Writing Now - Application Constants
 * Centralized configuration and fallback data
 */

// App Configuration
export const APP_CONFIG = {
    TIMER_DURATION: 180, // 3 minutes in seconds
    MIN_WORDS_FOR_STREAK: 25,
    PROMPTS_CACHE_KEY: 'recentPrompts',
    MAX_RECENT_PROMPTS: 10,
    PROMPTS_TIMEOUT: 5000, // 5 seconds
    SEARCH_DEBOUNCE_DELAY: 300, // 300ms
    EMAIL_OFFER_COOLDOWN: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Audio Configuration
export const AUDIO_CONFIG = {
    CHIME_FREQUENCIES: [523.25, 659.25, 783.99], // C5, E5, G5
    CHIME_DURATION: 1.5,
    CHIME_VOLUME: 0.3,
    NOTE_DELAY: 0.2,
};

// Local Storage Keys
export const STORAGE_KEYS = {
    WRITING_ENTRIES: 'writingEntries',
    WRITING_STREAK: 'writingStreak',
    DARK_MODE: 'darkMode',
    RECENT_PROMPTS: 'recentPrompts',
    EMAIL_BACKUP_DECLINED: 'emailBackupDeclined',
    LAST_EMAIL_BACKUP_OFFER: 'lastEmailBackupOffer',
    STREAK_EMAIL_OFFERED: 'streakEmailOffered',
    LAST_PROMPT_LOAD_ERROR: 'lastPromptLoadError',
};

// Fallback Prompts (embedded for offline use)
export const FALLBACK_PROMPTS = {
    life: [
        "What's one thing that made you smile today?",
        "Describe a moment when you felt completely at peace.",
        "What's something you're grateful for right now?",
        "If you could tell your past self one thing, what would it be?",
        "What's a small win you had recently?",
        "Describe your ideal Sunday morning.",
        "What's something new you learned this week?",
        "How do you want to feel by the end of today?",
        "What's a challenge you're facing, and how might you approach it?",
        "Describe a person who has positively impacted your life.",
        "What's something you're looking forward to?",
        "How has your perspective on something changed recently?",
        "What would you do if you knew you couldn't fail?",
        "What's a habit you'd like to develop?",
        "How do you show kindness to yourself?",
        "What's something that always makes you laugh?",
        "Describe a place where you feel most like yourself.",
        "What's the best advice you've ever received?",
        "How do you like to celebrate small victories?",
        "What's something you're curious about right now?"
    ],
    career: [
        "What's the most valuable skill you've developed this year?",
        "Describe a project you're proud of and why.",
        "What's a professional challenge you're currently navigating?",
        "How do you define success in your career?",
        "What's something you want to learn to advance professionally?",
        "Describe your ideal work environment.",
        "What's a piece of feedback that changed how you work?",
        "How do you maintain work-life balance?",
        "What's a professional relationship that has been meaningful to you?",
        "Describe a time when you had to step outside your comfort zone at work."
    ]
};

// UI Messages
export const MESSAGES = {
    LOADING_PROMPTS: 'Loading your writing prompt...',
    NO_TEXT_COPY: 'Please write something before copying!',
    NO_TEXT_DOWNLOAD: 'Please write something before downloading!',
    TIMER_COMPLETE: 'Great job! You completed your 3-minute writing session. 🎉',
    ENTRY_COPIED: 'Entry copied to clipboard! 📋',
    ENTRY_COPIED_SHORT: 'Entry copied to clipboard! Write 25+ words next time to count toward your streak. 📋',
    ENTRY_DOWNLOADED: 'Your journal entry has been downloaded! 📝',
    ENTRY_DOWNLOADED_SHORT: 'Your journal entry has been downloaded! Write 25+ words next time to count toward your streak. 📝',
    CLIPBOARD_FALLBACK: 'Unable to copy to clipboard. Please try the download option instead.',
    NO_ENTRIES_EXPORT: 'No entries to export!',
    DELETE_CONFIRM: 'Are you sure you want to delete this entry? This cannot be undone.',
    CLEAR_ALL_CONFIRM: 'Are you sure you want to delete ALL entries? This cannot be undone.',
    CLEAR_ALL_FINAL_CONFIRM: 'This will permanently delete all your writing history. Are you absolutely sure?',
    ALL_ENTRIES_DELETED: 'All entries have been deleted.',
    EMAIL_BACKUP_OFFER: '💌 Want to email this entry to yourself?\n\n(You can also join my weekly newsletter for exclusive writing prompts)',
    STREAK_PROTECTION_OFFER: '🔥 7-day streak achieved! Want a gentle daily reminder to keep your streak alive?\n\n(I\'ll also send weekly writing prompts to help you grow)',
    NEWSLETTER_THANKS: '✅ Thanks! You\'ll receive weekly writing prompts and updates.',
    STREAK_START: 'Start your writing streak!',
    ABOUT_TEXT: `About Start Writing

This is an intelligent micro-journaling app designed to help you capture your thoughts with the perfect prompts.

How it works:
• Choose Personal or Professional writing mode
• Get smart prompts that adapt to time of day and season
• Start typing to begin the 3-minute timer
• Write freely without worrying about structure
• Your entries are automatically saved to your history

Smart Features:
• Time-aware prompts (different for morning vs evening)
• Intelligent prompt selection that avoids recent duplicates
• Seasonal and contextual awareness
• Full writing history with search and export
• Works completely offline

The goal is to make writing a daily habit through short, focused sessions with perfectly matched prompts. No accounts needed - everything saves locally in your browser.

Perfect for daily reflection, gratitude practice, career planning, or creative expression.`
};

// Streak Messages
export const STREAK_MESSAGES = {
    1: 'Great job starting your writing streak! 🎉',
    3: 'Amazing! 3 days in a row! 🔥',
    7: 'Incredible! You\'ve written for a whole week! 🌟',
    14: 'Two weeks of writing! You\'re building a real habit! 💪',
    30: 'One month streak! You\'re a writing champion! 🏆',
    getMultipleTenMessage: (streak) => `${streak} days of writing! Absolutely incredible! 🎊`
};

// Mode Emojis
export const MODE_EMOJIS = {
    'personal': '💭',
    'professional': '💼'
};

// File Paths
export const PATHS = {
    PROMPTS_JSON: './assets/data/prompts.json'
};