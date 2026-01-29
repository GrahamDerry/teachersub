# LiveSub Classroom - Multi-Device Caption Broadcast System

A real-time caption broadcast system for classroom use that provides speech-to-text captions from a teacher's device to multiple student devices via WebSocket. Perfect for EFL (English as a Foreign Language) teaching with projector or screen sharing.

## Features

### 🎤 Real-time Speech Recognition & Broadcasting
- Uses Chrome's Web Speech API for continuous speech-to-text
- WebSocket-based real-time caption broadcasting
- Teacher device captures speech and broadcasts to all connected students
- Automatic reconnection on network glitches
- Pause/resume functionality for better control

### 📱 Multi-Device Support
- **Teacher Interface**: Full-featured caption creation and management
- **Student Interface**: Clean, dedicated view for receiving captions
- **Real-time Sync**: Captions appear instantly on all student devices
- **Reconnection Logic**: Students automatically reconnect if connection is lost

### 📝 Interactive Transcript (Teacher)
- Scrollable transcript with newest content at bottom
- Click any word to get instant Thai translation
- Automatic line management (keeps last 500 lines)
- Export transcript as downloadable text file

### 🌐 Translation Features
- LibreTranslate integration for English→Thai translations
- Smart caching (200 entries) to reduce API calls
- Rate limiting to respect API limits
- Graceful error handling for network issues

### 💾 Vocabulary Management
- Save words and translations to "My Words" sidebar
- Persistent storage using localStorage
- Easy word removal and management
- Clean, organized interface

### 🎨 Modern UI
- Responsive design with Tailwind CSS
- Clean, professional interface
- Keyboard shortcuts for power users
- Smooth animations and transitions

## Quick Start

### Development Setup (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the WebSocket server (backend):**
   ```bash
   npm run dev:server
   ```
   This starts the Express server with WebSocket support on port 3000.

3. **Start the development server (frontend):**
   ```bash
   npx vite --port 3001 --host
   ```
   This starts the Vite dev server on port 3001. The `--host` flag is **required** so student phones on the same WiFi network can connect.

4. **Access the applications:**
   - **Teacher Interface**: `http://localhost:3001/`
   - **Student Interface**: `http://localhost:3001/student.html`

### Production Setup

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

3. **Access the applications:**
   - **Teacher Interface**: `http://localhost:3000/`
   - **Student Interface**: `http://localhost:3000/student.html`

## System Architecture

### Server Setup
- **Express Server** (Port 3000): WebSocket server + static file hosting
- **Vite Dev Server** (Port 3001): Development server with hot reload
- **WebSocket Protocol**: Real-time communication between teacher and students

### Client Setup
- **Teacher Device**: Runs the main application with speech recognition
- **Student Devices**: Run the student interface to receive captions
- **WebSocket Connection**: All clients connect to `ws://localhost:3000`

## Usage

### Teacher Setup
1. **Open Teacher Interface**: Navigate to `http://localhost:3001/`
2. **Start Recording**: Click "Start" to begin speech recognition
3. **Speak**: Your speech appears as live captions and broadcasts to students
4. **Manage**: Use pause, clear, and download features as needed

### Student Setup
1. **Open Student Interface**: Navigate to `http://localhost:3001/student.html`
2. **Automatic Connection**: Students automatically connect to the WebSocket server
3. **Receive Captions**: Captions appear in real-time as the teacher speaks
4. **Reconnection**: If connection is lost, students automatically reconnect

### Translation Features (Teacher Only)
1. **Click Words**: Click any word in the transcript
2. **View Translation**: Thai translation appears in a popover
3. **Save Words**: Click "Save Word" to add to your vocabulary list
4. **Access Vocabulary**: Use the purple sidebar button to view saved words

### Keyboard Shortcuts (Teacher)
- `Ctrl/Cmd + Enter`: Start/Stop recording
- `Ctrl/Cmd + P`: Pause/Resume display
- `Ctrl/Cmd + C`: Clear screen
- `Ctrl/Cmd + S`: Download transcript
- `Escape`: Close translation popover

## Technical Details

### Architecture
- **Backend**: Express.js with WebSocket (ws) for real-time communication
- **Frontend**: Vanilla JavaScript with ES modules
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS (CDN)
- **Speech Recognition**: Web Speech API (webkitSpeechRecognition)
- **Translation**: LibreTranslate public API
- **Storage**: localStorage for vocabulary persistence

### File Structure
```
├── server/
│   └── index.js           # Express + WebSocket server
├── src/
│   ├── main.js            # Teacher application entry point
│   ├── student.js         # Student interface
│   ├── transcript.js      # Transcript management + WebSocket
│   ├── translator.js      # Translation API integration
│   ├── sidebar.js         # Vocabulary sidebar
│   ├── popover.js         # Translation popover
│   └── utils.js           # Utility functions
├── student.html           # Student interface HTML
├── index.html             # Teacher interface HTML
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

### WebSocket Communication
- **Message Format**: JSON with `{type: 'caption', line: text, ts: timestamp}`
- **Broadcasting**: Teacher sends captions, server relays to all students
- **Reconnection**: Exponential backoff with max 16-second delays
- **Error Handling**: Graceful handling of connection issues

### API Integration
- **LibreTranslate**: `https://libretranslate.de/translate`
- **Rate Limiting**: 1 second between requests
- **Caching**: In-memory LRU cache (200 entries)
- **Error Handling**: Graceful fallbacks for network issues

## Browser Requirements

- **Chrome v115+** (required for Web Speech API)
- Microphone permissions (teacher device only)
- Internet connection (for translations)

## Known Limitations

### Current Prototype
- **Browser Support**: Chrome only (Web Speech API limitation)
- **Network Dependency**: Requires internet for translations
- **Local Network**: Designed for local network use
- **Audio Quality**: Depends on microphone quality
- **Translation Accuracy**: Uses free LibreTranslate service

### Technical Constraints
- **Speech Recognition**: Limited to English language
- **Translation**: English→Thai only
- **Storage**: Limited to browser localStorage
- **Performance**: Large transcripts may impact memory usage

## Next Steps

### Production Features
- **Google Cloud Speech**: Replace Web Speech API for better accuracy
- **Authentication**: User accounts and session management
- **Firestore Integration**: Cloud-based vocabulary storage
- **Analytics**: Usage tracking and performance metrics
- **Multi-language**: Support for additional languages

### Deployment Features
- **Docker Deployment**: Containerized application
- **Cloud Hosting**: Scalable deployment options
- **SSL Support**: Secure WebSocket connections
- **Load Balancing**: Multiple server instances

### Advanced Features
- **Room Management**: Multiple classrooms/channels
- **Offline Mode**: PWA capabilities for offline use
- **Mobile Support**: Progressive Web App features
- **Recording**: Save and replay caption sessions

## Development

### Adding TypeScript
The project is configured for TypeScript migration:
1. Rename `.js` files to `.ts`
2. Add type annotations
3. Run `npm run build` to compile

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Chrome
5. Submit a pull request

## Troubleshooting

### Common Issues
- **Student Phones Can't Connect**: Make sure Vite is running with the `--host` flag: `npx vite --port 3001 --host`
- **WebSocket Connection Failed**: Ensure the Express server is running on port 3000
- **Speech Recognition Not Working**: Check microphone permissions in Chrome
- **Captions Not Broadcasting**: Verify both teacher and student are connected to WebSocket
- **Translation Errors**: Check internet connection and LibreTranslate service status

### Debug Mode
- Open browser console to see WebSocket connection status
- Check server logs for connection and message relay information
- Verify ports are not in use by other applications

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check browser compatibility (Chrome v115+)
- Ensure microphone permissions are granted (teacher device)
- Verify internet connection for translations
- Review console for error messages
- Check WebSocket connection status

---

**Built for EFL educators** - Making language learning more accessible and interactive with real-time multi-device caption broadcasting! 🎓 