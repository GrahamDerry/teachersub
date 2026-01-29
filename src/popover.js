// @ts-check

/**
 * Manages translation popovers
 */
export class PopoverManager {
    constructor(translator, sidebar) {
        this.translator = translator;
        this.sidebar = sidebar;
        this.popover = document.getElementById('translationPopover');
        this.popoverWord = document.getElementById('popoverWord');
        this.popoverTranslation = document.getElementById('popoverTranslation');
        this.saveWordBtn = document.getElementById('saveWordBtn');
        this.closePopoverBtn = document.getElementById('closePopover');
        
        this.currentWord = '';
        this.currentTranslation = '';
        
        this.bindEvents();
    }

    /**
     * Show the translation popover for a word
     * @param {string} word - The word to translate
     * @param {Event} event - The click event
     */
    async show(word, event) {
        if (!this.popover || !this.popoverWord || !this.popoverTranslation) {
            return;
        }

        this.currentWord = word;
        this.popoverWord.textContent = word;
        this.popoverTranslation.textContent = 'Loading translation...';
        
        // Position the popover near the clicked word
        this.positionPopover(event);
        
        // Show the popover
        this.popover.classList.remove('hidden');
        
        // Get translation
        try {
            this.currentTranslation = await this.translator.translate(word);
            this.popoverTranslation.textContent = this.currentTranslation;
            
            // Update save button state
            this.updateSaveButton();
        } catch {
            this.popoverTranslation.textContent = 'Translation unavailable';
            this.currentTranslation = '';
        }
    }

    /**
     * Hide the popover
     */
    hide() {
        if (this.popover) {
            this.popover.classList.add('hidden');
        }
        this.currentWord = '';
        this.currentTranslation = '';
    }

    /**
     * Position the popover relative to the clicked element
     * @param {Event} event - The click event
     */
    positionPopover(event) {
        if (!this.popover) return;

        const target = event.target;
        if (!target || !(target instanceof HTMLElement)) return;

        const rect = target.getBoundingClientRect();
        const popoverRect = this.popover.getBoundingClientRect();
        
        // Calculate position
        let left = rect.left + (rect.width / 2) - (popoverRect.width / 2);
        let top = rect.bottom + 10;
        
        // Ensure popover stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust horizontal position
        if (left < 10) {
            left = 10;
        } else if (left + popoverRect.width > viewportWidth - 10) {
            left = viewportWidth - popoverRect.width - 10;
        }
        
        // Adjust vertical position
        if (top + popoverRect.height > viewportHeight - 10) {
            // Show above the word if there's not enough space below
            top = rect.top - popoverRect.height - 10;
        }
        
        this.popover.style.left = `${left}px`;
        this.popover.style.top = `${top}px`;
    }

    /**
     * Update the save button state
     */
    updateSaveButton() {
        if (!this.saveWordBtn || !(this.saveWordBtn instanceof HTMLButtonElement)) return;

        if (!this.currentTranslation || this.currentTranslation === 'Translation unavailable') {
            this.saveWordBtn.disabled = true;
            this.saveWordBtn.textContent = 'Cannot Save';
            this.saveWordBtn.className = 'bg-gray-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed';
        } else if (this.sidebar.isWordSaved(this.currentWord)) {
            this.saveWordBtn.disabled = true;
            this.saveWordBtn.textContent = 'Already Saved';
            this.saveWordBtn.className = 'bg-green-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed';
        } else {
            this.saveWordBtn.disabled = false;
            this.saveWordBtn.textContent = 'Save Word';
            this.saveWordBtn.className = 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors';
        }
    }

    /**
     * Save the current word and translation
     */
    saveCurrentWord() {
        if (!this.currentWord || !this.currentTranslation || this.currentTranslation === 'Translation unavailable') {
            return;
        }

        const success = this.sidebar.saveWord(this.currentWord, this.currentTranslation);
        
        if (success) {
            // Show success feedback
            this.saveWordBtn.textContent = 'Saved!';
            this.saveWordBtn.className = 'bg-green-600 text-white px-3 py-1 rounded text-sm cursor-not-allowed';
            this.saveWordBtn.disabled = true;
            
            // Hide popover after a short delay
            setTimeout(() => {
                this.hide();
            }, 1500);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Save word button
        if (this.saveWordBtn) {
            this.saveWordBtn.addEventListener('click', () => {
                this.saveCurrentWord();
            });
        }

        // Close popover button
        if (this.closePopoverBtn) {
            this.closePopoverBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close popover when clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target || !(target instanceof Node)) return;
            
            if (!this.popover?.contains(target) && !(target instanceof HTMLElement && target.classList.contains('word-clickable'))) {
                this.hide();
            }
        });

        // Close popover on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    /**
     * Get the current word being displayed
     * @returns {string} Current word
     */
    getCurrentWord() {
        return this.currentWord;
    }

    /**
     * Get the current translation
     * @returns {string} Current translation
     */
    getCurrentTranslation() {
        return this.currentTranslation;
    }

    /**
     * Check if popover is visible
     * @returns {boolean} True if popover is visible
     */
    isVisible() {
        return this.popover && !this.popover.classList.contains('hidden');
    }
} 