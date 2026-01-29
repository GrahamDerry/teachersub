// @ts-check

import { TranscriptManager } from './transcript.js';
import { Translator } from './translator.js';
import { SidebarManager } from './sidebar.js';
import { PopoverManager } from './popover.js';
import { QRCodeManager } from './qrcode.js';
import { downloadFile } from './utils.js';

// @ts-ignore - Add captionSocket to window object
window.captionSocket = window.captionSocket || null;

/**
 * Main application class that coordinates all components
 */
class LiveSubApp {
    constructor() {
        this.isRecording = false;
        this.isPaused = false;
        this.isRestarting = false;
        this.recognition = null;
        this.currentInterimText = '';
        this.recognitionLang = 'en-US';
        
        // Direction texts in different languages
        this.directionTexts = {
            'en-US': 'Click "Start" to begin speech recognition...',
            'th-TH': 'คลิก "Start" เพื่อเริ่มการรู้จำเสียง...',
            'zh-CN': '点击 "Start" 开始语音识别...'
        };

        // Map recognition language codes to translation language codes
        this.langCodeMap = {
            'en-US': 'en',
            'th-TH': 'th',
            'zh-CN': 'zh'
        };
        
        // Initialize components
        this.transcript = new TranscriptManager();
        this.translator = new Translator();
        this.sidebar = new SidebarManager();
        this.popover = new PopoverManager(this.translator, this.sidebar);
        this.qrCode = new QRCodeManager();

        // Set initial source language based on recognition language
        this.translator.setSourceLanguage(this.langCodeMap[this.recognitionLang] || 'en');
        
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.loadSavedWords();
    }

    /**
     * Initialize the Web Speech API recognition
     */
    initializeSpeechRecognition() {
        console.log('Initializing speech recognition...');
        console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
        
        if (!('webkitSpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            alert('Speech recognition is not supported in this browser. Please use Chrome.');
            return;
        }

        try {
            // @ts-ignore - webkitSpeechRecognition is available in Chrome
            this.recognition = new webkitSpeechRecognition();
            console.log('Speech recognition object created:', this.recognition);
        } catch (error) {
            console.error('Error creating speech recognition object:', error);
            alert('Error creating speech recognition: ' + error.message);
            return;
        }
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.recognitionLang;

        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isRestarting = false;
            this.updateUI('recording');
        };

        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                // Auto-restart on common errors, but only if not already restarting
                if (!this.isRestarting && this.isRecording) {
                    setTimeout(() => {
                        if (this.isRecording && !this.isRestarting) {
                            this.restartRecognition();
                        }
                    }, 1000);
                }
            }
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            // Auto-restart if we're still supposed to be recording and not already restarting
            if (this.isRecording && !this.isRestarting) {
                setTimeout(() => {
                    if (this.isRecording && !this.isRestarting) {
                        this.restartRecognition();
                    }
                }, 100);
            } else {
                this.updateUI('stopped');
            }
        };
    }

    /**
     * Handle speech recognition results
     */
    handleSpeechResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Update live caption with interim results
        if (interimTranscript && !this.isPaused) {
            this.currentInterimText = interimTranscript;
            this.transcript.setLiveText(interimTranscript);
        }

        // Add final results to transcript
        if (finalTranscript) {
            this.currentInterimText = '';
            const { transcriptLineElement, recentLineElement } = this.transcript.addLine(finalTranscript);
            this.transcript.setLiveText('');
            
            // Auto-translate the line (teacher-side only)
            this.autoTranslateLine(finalTranscript, transcriptLineElement, recentLineElement);
        }
    }

    /**
     * Auto-translate a transcript line and display below the original
     * @param {string} text - The text to translate
     * @param {HTMLElement|null} transcriptLineElement - The transcript line element
     * @param {HTMLElement|null} recentLineElement - The recent line element in live caption area
     */
    async autoTranslateLine(text, transcriptLineElement = null, recentLineElement = null) {
        // Skip if source and target languages are the same
        if (!this.translator.shouldTranslate()) {
            console.log('Skipping translation: source and target languages are the same');
            return;
        }

        // Fall back to getting the last elements if not provided
        if (!transcriptLineElement) {
            transcriptLineElement = this.transcript.getLastLineElement();
        }
        if (!recentLineElement) {
            recentLineElement = this.transcript.getLastRecentLineElement();
        }

        if (!transcriptLineElement && !recentLineElement) {
            console.error('Could not find any line elements for translation');
            return;
        }

        try {
            console.log(`Auto-translating: "${text}" from ${this.translator.getSourceLanguage()} to ${this.translator.getTargetLanguage()}`);
            const translation = await this.translator.translate(text);
            
            if (translation) {
                // Update transcript line
                if (transcriptLineElement) {
                    this.transcript.setLineTranslation(transcriptLineElement, translation);
                }
                // Update recent line in live caption area
                if (recentLineElement) {
                    this.transcript.setRecentLineTranslation(recentLineElement, translation);
                }
                console.log(`Translation complete: "${translation}"`);
            }
        } catch (error) {
            console.error('Auto-translation failed:', error);
        }
    }

    /**
     * Restart speech recognition after an error
     */
    restartRecognition() {
        if (this.isRestarting) {
            console.log('Already restarting, skipping...');
            return;
        }
        
        this.isRestarting = true;
        console.log('Restarting speech recognition...');
        
        try {
            this.recognition.stop();
        } catch {
            // Ignore errors when stopping
        }
        
        setTimeout(() => {
            if (this.isRecording && this.isRestarting) {
                try {
                    this.recognition.start();
                    console.log('Speech recognition restart started');
                } catch (error) {
                    console.error('Error restarting speech recognition:', error);
                    this.isRestarting = false;
                }
            } else {
                this.isRestarting = false;
            }
        }, 100);
    }

    /**
     * Start speech recognition
     */
    startRecording() {
        console.log('startRecording called');
        if (!this.recognition) {
            console.error('Speech recognition not available');
            alert('Speech recognition not available');
            return;
        }

        console.log('Starting speech recognition...');
        this.isRecording = true;
        try {
            this.recognition.start();
            console.log('Speech recognition start() called');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            alert('Error starting speech recognition: ' + error.message);
        }
    }

    /**
     * Stop speech recognition
     */
    stopRecording() {
        this.isRecording = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        this.currentInterimText = '';
        this.transcript.setLiveText('');
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.transcript.setLiveText('PAUSED');
        } else {
            this.transcript.setLiveText(this.currentInterimText);
        }
        this.updateUI('paused');
    }

    /**
     * Set the recognition language
     * @param {string} langCode - The language code (e.g., 'en-US', 'th-TH', 'zh-CN')
     */
    setRecognitionLanguage(langCode) {
        this.recognitionLang = langCode;
        
        // Update the recognition object's language
        if (this.recognition) {
            this.recognition.lang = langCode;
        }

        // Update the translator's source language to match
        const translationLangCode = this.langCodeMap[langCode] || 'en';
        this.translator.setSourceLanguage(translationLangCode);
        
        // Update the directions text if not currently recording
        if (!this.isRecording) {
            const liveCaption = document.getElementById('liveCaption');
            if (liveCaption) {
                liveCaption.textContent = this.directionTexts[langCode] || this.directionTexts['en-US'];
            }
        }
        
        // If currently recording, restart to apply the new language
        if (this.isRecording) {
            this.restartRecognition();
        }
        
        console.log('Recognition language set to:', langCode);
    }

    /**
     * Clear all transcript content
     */
    clearTranscript() {
        this.transcript.clear();
        this.currentInterimText = '';
        this.transcript.setLiveText('');
    }

    /**
     * Download transcript as text file
     */
    downloadTranscript() {
        const lines = this.transcript.getLines();
        if (lines.length === 0) {
            alert('No transcript to download');
            return;
        }

        const content = lines.join('\n');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `livesub-transcript-${timestamp}.txt`;
        
        downloadFile(content, filename, 'text/plain');
    }

    /**
     * Load saved words from localStorage
     */
    loadSavedWords() {
        this.sidebar.loadSavedWords();
    }

    /**
     * Update UI based on current state
     */
    updateUI(state) {
        const startBtn = document.getElementById('startBtn');
        const liveCaption = document.getElementById('liveCaption');

        if (!startBtn || !liveCaption) return;

        switch (state) {
            case 'recording':
                startBtn.textContent = 'Stop';
                startBtn.className = 'bg-white text-purple-500 border-2 border-purple-400 px-4 py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]';
                break;
            case 'stopped':
                startBtn.textContent = 'Start';
                startBtn.className = 'btn-neon text-white px-4 py-2 rounded-lg font-medium';
                liveCaption.textContent = this.directionTexts[this.recognitionLang] || this.directionTexts['en-US'];
                break;
        }
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Start/Stop button
        document.getElementById('startBtn').addEventListener('click', () => {
            console.log('Start button clicked, isRecording:', this.isRecording);
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearTranscript();
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadTranscript();
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.sidebar.toggle();
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.sidebar.close();
        });

        // QR Code button
        document.getElementById('qrBtn').addEventListener('click', () => {
            this.qrCode.show();
        });

        // Translation language selector
        const langSelect = document.getElementById('translationLang');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                const target = e.target;
                if (target instanceof HTMLSelectElement) {
                    this.translator.setTargetLanguage(target.value);
                }
            });
        }

        // Recognition language selector
        const recognitionLangSelect = document.getElementById('recognitionLang');
        if (recognitionLangSelect) {
            recognitionLangSelect.addEventListener('change', (e) => {
                const target = e.target;
                if (target instanceof HTMLSelectElement) {
                    this.setRecognitionLanguage(target.value);
                }
            });
        }

        // Handle word clicks from transcript
        document.addEventListener('wordClick', (e) => {
            const { word, event } = e.detail;
            this.popover.show(word, event);
        });

        // Close popover when clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target || !(target instanceof Node)) return;
            
            if (!this.popover?.contains(target) && !(target instanceof HTMLElement && target.classList.contains('word-clickable'))) {
                this.popover.hide();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (this.isRecording) {
                            this.stopRecording();
                        } else {
                            this.startRecording();
                        }
                        break;
                    case 'p':
                        e.preventDefault();
                        this.togglePause();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.clearTranscript();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadTranscript();
                        break;
                }
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('LiveSub Classroom initializing...');
    try {
        new LiveSubApp();
        console.log('LiveSub Classroom initialized successfully');
    } catch (error) {
        console.error('Failed to initialize LiveSub Classroom:', error);
        alert('Failed to initialize application: ' + error.message);
    }
}); 