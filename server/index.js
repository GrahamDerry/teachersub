import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

/**
 * Get the local network IP address (for LAN access from phones)
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal/loopback and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const app = express();

// Enable CORS for dev server on different port
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// API endpoint for QR code to get the student connection URL (BEFORE static)
app.get('/api/connection-info', (req, res) => {
  const localIP = getLocalIP();
  const port = httpServer.address().port;
  const studentUrl = `http://${localIP}:${port}/student.html`;
  
  console.log(`Connection info requested. Student URL: ${studentUrl}`);
  
  res.json({
    studentUrl,
    ip: localIP,
    port
  });
});

// Serve static files from dist
app.use(express.static(DIST_DIR));

const httpServer = app.listen(process.env.PORT || 3000, () => {
  const localIP = getLocalIP();
  console.log(`HTTP listening on ${httpServer.address().port}`);
  console.log(`Student URL for phones: http://${localIP}:${httpServer.address().port}/student.html`);
});

const wss = new WebSocketServer({ server: httpServer });
console.log('WebSocket server created');

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.on('message', (data) => {
    console.log("Relaying message", data.toString());
    // relay to everyone *except* sender
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === 1) client.send(data);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

/* ---------- TODO: Service-worker / PWA offline support ----------
   Steps:
   1. Generate sw.js with Vite PWA plugin or manual Workbox.
   2. Cache built assets + student.html.
   3. Serve cached captions when socket temporarily offline.
------------------------------------------------------------------ */ 