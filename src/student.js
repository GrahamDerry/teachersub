console.log('Student JS loaded');
const el = document.getElementById('app');
const statusEl = document.getElementById('status');

function updateStatus(message, isConnected = false) {
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = isConnected 
      ? 'text-green-500 text-lg mb-4' 
      : 'text-gray-500 text-lg mb-4';
  }
}

function addLine(text) {
  // Hide status once we get content
  if (statusEl) {
    statusEl.style.display = 'none';
  }
  
  const p = document.createElement('p');
  p.textContent = text;
  p.className = 'caption-line mb-2';
  el.appendChild(p);
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

/* --- reconnecting WS helper --- */
function connect(retry = 0) {
  // Use the same hostname as the page, with port 3000 for WebSocket
  const wsUrl = `ws://${location.hostname}:3000`;
  console.log('Student connecting to WebSocket:', wsUrl);
  
  updateStatus('Connecting to teacher...');
  
  try {
    const sock = new WebSocket(wsUrl);
    
    sock.onopen = () => {
      console.log('Student WebSocket connected successfully');
      updateStatus('✓ Connected! Waiting for captions...', true);
    };
    
    sock.onmessage = async (e) => {
      let msg;
      
      try {
        if (e.data instanceof Blob) {
          const text = await e.data.text();
          msg = JSON.parse(text);
        } else {
          msg = JSON.parse(e.data);
        }
        
        if (msg.type === 'caption') {
          addLine(msg.line);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    sock.onclose = () => {
      const delay = Math.min(16000, 1000 * 2 ** retry);
      console.warn(`WS closed – retrying in ${delay / 1000}s`);
      updateStatus(`Disconnected. Reconnecting in ${delay / 1000}s...`);
      setTimeout(() => connect(retry + 1), delay);
    };
    
    sock.onerror = (error) => {
      console.error('Student WebSocket error:', error);
      updateStatus('Connection error. Retrying...');
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
    updateStatus('Failed to connect. Retrying...');
    setTimeout(() => connect(retry + 1), 2000);
  }
}

// Start connection immediately
connect(); 