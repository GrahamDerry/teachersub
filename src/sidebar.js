// @ts-check

/**
 * Manages the sidebar for saved words
 */
export class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.savedWordsContainer = document.getElementById('savedWords');
        this.storageKey = 'livesub_mywords';
        this.savedWords = [];
        
        this.loadSavedWords();
    }

    /**
     * Toggle sidebar visibility
     */
    toggle() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('open');
        }
    }

    /**
     * Open the sidebar
     */
    open() {
        if (this.sidebar) {
            this.sidebar.classList.add('open');
        }
    }

    /**
     * Close the sidebar
     */
    close() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
        }
    }

    /**
     * Load saved words from localStorage
     */
    loadSavedWords() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.savedWords = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading saved words:', error);
            this.savedWords = [];
        }
        
        this.renderSavedWords();
    }

    /**
     * Save a word and its translation
     * @param {string} word - The word to save
     * @param {string} translation - The translation
     */
    saveWord(word, translation) {
        const cleanWord = word.trim().toLowerCase();
        if (!cleanWord || !translation) {
            return false;
        }

        // Check if word already exists
        const existingIndex = this.savedWords.findIndex(item => item.word === cleanWord);
        
        if (existingIndex >= 0) {
            // Update existing entry
            this.savedWords[existingIndex].translation = translation;
            this.savedWords[existingIndex].updatedAt = new Date().toISOString();
        } else {
            // Add new entry
            this.savedWords.push({
                word: cleanWord,
                translation: translation,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        // Sort by most recently updated
        this.savedWords.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        this.saveToStorage();
        this.renderSavedWords();
        
        return true;
    }

    /**
     * Remove a saved word
     * @param {string} word - The word to remove
     */
    removeWord(word) {
        const cleanWord = word.trim().toLowerCase();
        this.savedWords = this.savedWords.filter(item => item.word !== cleanWord);
        
        this.saveToStorage();
        this.renderSavedWords();
    }

    /**
     * Save words to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.savedWords));
        } catch (error) {
            console.error('Error saving words to localStorage:', error);
        }
    }

    /**
     * Render the saved words list
     */
    renderSavedWords() {
        if (!this.savedWordsContainer) {
            return;
        }

        if (this.savedWords.length === 0) {
            this.savedWordsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    <p class="text-sm">No saved words yet</p>
                    <p class="text-xs mt-1">Click on words in the transcript to save them</p>
                </div>
            `;
            return;
        }

        const wordsList = this.savedWords.map(item => {
            const date = new Date(item.updatedAt).toLocaleDateString();
            return `
                <div class="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900 mb-1">${this.escapeHtml(item.word)}</div>
                            <div class="text-gray-600 text-sm mb-2">${this.escapeHtml(item.translation)}</div>
                            <div class="text-xs text-gray-400">Updated: ${date}</div>
                        </div>
                        <button 
                            class="text-red-500 hover:text-red-700 ml-2 p-1"
                            onclick="this.removeWord('${this.escapeHtml(item.word)}')"
                            title="Remove word"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.savedWordsContainer.innerHTML = wordsList;

        // Add event listeners for remove buttons
        this.savedWordsContainer.querySelectorAll('[onclick*="removeWord"]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                if (target && target instanceof HTMLElement) {
                    const onclick = target.getAttribute('onclick');
                    if (onclick) {
                        const match = onclick.match(/'([^']+)'/);
                        if (match) {
                            this.removeWord(match[1]);
                        }
                    }
                }
            });
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get all saved words
     * @returns {Array} Array of saved word objects
     */
    getSavedWords() {
        return [...this.savedWords];
    }

    /**
     * Check if a word is already saved
     * @param {string} word - Word to check
     * @returns {boolean} True if word is saved
     */
    isWordSaved(word) {
        const cleanWord = word.trim().toLowerCase();
        return this.savedWords.some(item => item.word === cleanWord);
    }

    /**
     * Get the count of saved words
     * @returns {number} Number of saved words
     */
    getWordCount() {
        return this.savedWords.length;
    }

    /**
     * Clear all saved words
     */
    clearAllWords() {
        this.savedWords = [];
        this.saveToStorage();
        this.renderSavedWords();
    }
} 