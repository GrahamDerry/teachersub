// @ts-check
import QRCode from 'qrcode';

/**
 * Manages QR code generation and display for student connections
 */
export class QRCodeManager {
  constructor() {
    this.modal = null;
    this.createModal();
    this.bindEvents();
  }

  /**
   * Create the QR code modal element
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'qrModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
        <h2 class="text-2xl font-bold mb-2 text-gray-800">📱 Join the Class</h2>
        <p class="text-gray-500 mb-4">Scan this QR code with your phone</p>
        <div class="bg-white p-4 rounded-lg inline-block mb-4 border-2 border-gray-100">
          <canvas id="qrCanvas"></canvas>
        </div>
        <p id="studentUrl" class="text-sm text-gray-600 mb-4 font-mono bg-gray-100 p-2 rounded break-all"></p>
        <div class="flex gap-3 justify-center">
          <button id="copyUrlBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            📋 Copy URL
          </button>
          <button id="closeQrModal" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.modal = modal;
  }

  /**
   * Show the QR code modal with the student connection URL
   */
  async show() {
    try {
      let studentUrl;
      
      // Always fetch from the Express server on port 3000
      // This works in both dev mode (Vite on 3001) and production (Express serves everything)
      // Use localhost explicitly for the API call since it's same-machine
      const apiBase = window.location.port === '3001' 
        ? 'http://localhost:3000'
        : '';
      
      try {
        console.log('Fetching connection info from:', `${apiBase}/api/connection-info`);
        const res = await fetch(`${apiBase}/api/connection-info`);
        if (res.ok) {
          const data = await res.json();
          studentUrl = data.studentUrl;
          console.log('Got student URL from API:', studentUrl);
        } else {
          console.warn('API response not ok:', res.status, res.statusText);
        }
      } catch (err) {
        console.warn('Failed to fetch connection info:', err);
      }

      // Fallback: construct URL manually using network IP detection
      if (!studentUrl) {
        // Try to get network IP by connecting to a known external service
        // This helps when the API call fails
        let networkIP = 'localhost';
        try {
          // Use WebRTC to detect local IP (works in most browsers)
          networkIP = await this.detectNetworkIP() || 'localhost';
        } catch (e) {
          console.warn('Could not detect network IP:', e);
        }
        studentUrl = `http://${networkIP}:3000/student.html`;
        console.log('Using fallback student URL:', studentUrl);
      }

      // Generate QR code
      const canvas = document.getElementById('qrCanvas');
      await QRCode.toCanvas(canvas, studentUrl, { 
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Show URL text
      const urlElement = document.getElementById('studentUrl');
      if (urlElement) {
        urlElement.textContent = studentUrl;
      }

      // Store URL for copy button
      this.currentUrl = studentUrl;

      // Show modal
      if (this.modal) {
        this.modal.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      alert('Failed to generate QR code. Make sure the server is running on port 3000.');
    }
  }

  /**
   * Hide the QR code modal
   */
  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  /**
   * Copy the student URL to clipboard
   */
  async copyUrl() {
    if (this.currentUrl) {
      try {
        await navigator.clipboard.writeText(this.currentUrl);
        const btn = document.getElementById('copyUrlBtn');
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
          btn.classList.add('bg-green-500');
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-green-500');
            btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  }

  /**
   * Detect the local network IP using WebRTC
   * This is a fallback when the server API is unavailable
   * @returns {Promise<string|null>} The detected IP or null
   */
  async detectNetworkIP() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2000);
      
      try {
        const rtc = new RTCPeerConnection({ iceServers: [] });
        rtc.createDataChannel('');
        
        rtc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            // Extract IP from candidate string
            const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
            if (ipMatch && !ipMatch[0].startsWith('127.')) {
              clearTimeout(timeout);
              rtc.close();
              resolve(ipMatch[0]);
            }
          }
        };
        
        rtc.createOffer()
          .then(offer => rtc.setLocalDescription(offer))
          .catch(() => {
            clearTimeout(timeout);
            resolve(null);
          });
      } catch (e) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  }

  /**
   * Bind event listeners for the modal
   */
  bindEvents() {
    // Wait for DOM elements to be available
    setTimeout(() => {
      document.getElementById('closeQrModal')?.addEventListener('click', () => this.hide());
      document.getElementById('copyUrlBtn')?.addEventListener('click', () => this.copyUrl());
      
      // Close on backdrop click
      this.modal?.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
          this.hide();
        }
      });
    }, 0);
  }
}

