// @ts-check

/**
 * Manages translation requests to MyMemory API with caching
 */
export class Translator {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 200;
        this.apiEndpoint = 'https://api.mymemory.translated.net/get';
        this.rateLimitDelay = 500; // 500ms between requests (MyMemory is more lenient)
        this.lastRequestTime = 0;
        this.sourceLanguage = 'en'; // Default source language (English)
        this.targetLanguage = 'th'; // Default to Thai
    }

    /**
     * Set the target language for translation
     * @param {string} lang - Language code ('en' for English, 'th' for Thai, 'zh' for Chinese)
     */
    setTargetLanguage(lang) {
        if (this.targetLanguage !== lang) {
            this.targetLanguage = lang;
            this.clearCache(); // Clear cache when language changes
            console.log(`Translation target language changed to: ${lang}`);
        }
    }

    /**
     * Get the current target language
     * @returns {string} Current target language code
     */
    getTargetLanguage() {
        return this.targetLanguage;
    }

    /**
     * Set the source language for translation
     * @param {string} lang - Language code ('en' for English, 'th' for Thai, 'zh' for Chinese)
     */
    setSourceLanguage(lang) {
        if (this.sourceLanguage !== lang) {
            this.sourceLanguage = lang;
            this.clearCache(); // Clear cache when language changes
            console.log(`Translation source language changed to: ${lang}`);
        }
    }

    /**
     * Get the current source language
     * @returns {string} Current source language code
     */
    getSourceLanguage() {
        return this.sourceLanguage;
    }

    /**
     * Check if translation is needed (source and target are different)
     * @returns {boolean} True if translation should occur
     */
    shouldTranslate() {
        return this.sourceLanguage !== this.targetLanguage;
    }

    /**
     * Translate text from source language to target language
     * @param {string} text - Text to translate
     * @returns {Promise<string>} Translated text
     */
    async translate(text) {
        const cleanText = text.trim().toLowerCase();
        if (!cleanText) {
            return '';
        }

        // Skip translation if source and target are the same
        if (!this.shouldTranslate()) {
            return '';
        }

        // Cache key includes language pair to avoid cross-contamination
        const cacheKey = `${this.sourceLanguage}|${this.targetLanguage}:${cleanText}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.delay(this.rateLimitDelay - timeSinceLastRequest);
        }

        try {
            const translation = await this.fetchTranslation(cleanText);
            
            // Cache the result with language pair key
            this.cache.set(cacheKey, translation);
            this.manageCacheSize();
            
            return translation;
        } catch (error) {
            console.error('Translation error:', error);
            return 'Translation unavailable';
        }
    }

    /**
     * Fetch translation from MyMemory API
     * @param {string} text - Text to translate
     * @returns {Promise<string>} Translated text
     */
    async fetchTranslation(text) {
        this.lastRequestTime = Date.now();

        // MyMemory API uses GET request with query parameters
        const langPair = `${this.sourceLanguage}|${this.targetLanguage}`;
        const url = `${this.apiEndpoint}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.responseStatus !== 200) {
            throw new Error(data.responseDetails || 'Translation failed');
        }

        return data.responseData?.translatedText || 'Translation unavailable';
    }

    /**
     * Manage cache size by removing oldest entries
     */
    manageCacheSize() {
        if (this.cache.size > this.maxCacheSize) {
            const entriesToRemove = this.cache.size - this.maxCacheSize;
            const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);
            keys.forEach(key => this.cache.delete(key));
        }
    }

    /**
     * Clear the translation cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize
        };
    }

    /**
     * Utility function to delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if a word is already cached
     * @param {string} word - Word to check
     * @returns {boolean} True if cached
     */
    isCached(word) {
        const cacheKey = `${this.sourceLanguage}|${this.targetLanguage}:${word.trim().toLowerCase()}`;
        return this.cache.has(cacheKey);
    }

    /**
     * Get cached translation if available
     * @param {string} word - Word to get translation for
     * @returns {string|undefined} Cached translation or undefined
     */
    getCachedTranslation(word) {
        const cacheKey = `${this.sourceLanguage}|${this.targetLanguage}:${word.trim().toLowerCase()}`;
        return this.cache.get(cacheKey);
    }
} 