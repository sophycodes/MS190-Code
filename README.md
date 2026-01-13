# FIGAROA: Data Echoes & Traces

![Project Banner](banner.jpg)

**MS190 Final Project - Fall 2024**

An interactive VR art installation exploring themes of data embodiment, techno-transcendence, digital surveillance, and the challenge of distinguishing authentic from fabricated information.

## Creator
- Sophy Figaroa

## Project Overview

FIGAROA is an immersive WebXR experience that examines how users leave permanent digital traces while navigating challenges around data privacy, misinformation, and AI-generated content. The installation guides visitors through three interconnected scenes, each designed to provoke reflection on our digital existence.

### Three Scenes

1. **Digital Rain Login (Scene 1)**
   - Matrix-inspired data visualization
   - Interactive "secret" collection system
   - Built with p5.js
   - Sets the tone for digital exploration

2. **VR Cyberspace (Scene 2 - Main Experience)**
   - Three themed realms accessible through portal navigation
   - Immersive VR environment with controller-based movement
   - Cross-device data persistence via Supabase
   - Scaled for 10ft × 5ft physical space

3. **Pixel Mirror (Scene 3)**
   - Real-time camera feed processing
   - Reflection on surveillance and digital self
   - Pixel art aesthetic

### The Three Realms

**🔴 Text Realm (Red)**
- Philosophical questions about truth and fiction
- AI vs. human writing detection challenges
- Interactive text input via VR keyboard
- Permanent text traces stored as data echoes

**🟢 Audio Realm (Green)**
- Voice recording system with spatial audio spheres
- AI vs. real audio detection games
- Persistent audio artifacts in virtual space
- Web Audio API integration

**🔵 Movement Realm (Blue)**
- Hand tracking and gesture-based interaction
- AI vs. real image authentication challenges
- Neon ghost trails showing movement history
- Real-time visual effects with Three.js shaders

### Key Themes
- **Data Embodiment**: Physical manifestation of digital traces
- **Techno-Transcendence**: VR as a medium for exploring consciousness
- **Digital Surveillance**: Awareness of persistent data collection
- **Truth vs. Fiction**: Navigating AI-generated vs. authentic content

---

## Technical Stack

### Core Technologies
- **A-Frame 1.4.0** - WebXR framework
- **Three.js** - 3D graphics and custom shaders
- **p5.js** - Digital rain visualization
- **Supabase** - Real-time database for data persistence
- **Web Audio API** - Voice recording and playback
- **MediaRecorder API** - Audio capture

### Development Tools
- VS Code with Live Server extension
- Git/GitHub for version control
- GitHub Pages for web deployment
- Meta Quest 2 for VR testing

### Architecture Highlights
- Component-based A-Frame architecture
- Scene management system for smooth realm transitions
- Persistent storage system (all user data saved to database)
- Responsive design scaled for physical installation space
- Kiosk Mode configuration for exhibition deployment

---

## Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge)
- HTTPS server (required for WebXR)
- Git
- **For VR**: Meta Quest 2 or compatible WebXR headset
- **Optional**: Node.js and npm (for local development server)

### Step 1: Clone the Repository

```bash
git clone https://github.com/[your-username]/FIGAROA.git
cd FIGAROA
```

### Step 2: Set Up Local HTTPS Server

**Option A: Using Python (Simple)**
```bash
# Python 3
python -m http.server 8000
```
⚠️ Note: WebXR requires HTTPS. For local testing, use GitHub Pages or ngrok.

**Option B: Using Live Server (VS Code)**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

**Option C: Using Node.js**
```bash
npm install -g http-server
http-server -S -C cert.pem -K key.pem
```

### Step 3: Configure Supabase (Optional)

If you want to enable data persistence:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update `config.js`:

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_KEY = 'your-anon-key';
```

4. Create the required table:
```sql
CREATE TABLE data_echoes (
  id SERIAL PRIMARY KEY,
  realm TEXT NOT NULL,
  content TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 4: Access the Experience

**Desktop (2D Preview):**
```
http://localhost:8000
```

**VR Headset:**
1. Deploy to GitHub Pages or use ngrok for HTTPS
2. Open the URL in Meta Quest browser
3. Click "Enter VR" button

---

## Project Structure

```
FIGAROA/
├── index.html                 # Scene 1: Digital Rain
├── vr-scene.html             # Scene 2: VR Cyberspace
├── pixel-mirror.html         # Scene 3: Camera Feed
├── sketch.js                 # p5.js digital rain logic
├── config.js                 # Supabase configuration
├── components/
│   ├── portal-button.js      # Realm navigation portals
│   ├── vr-keyboard.js        # Virtual text input
│   ├── scene-manager.js      # Realm switching logic
│   ├── audio-recorder.js     # Voice recording system
│   ├── trail-system.js       # Movement history visualization
│   └── intro-cards.js        # Informational UI elements
├── assets/
│   ├── textures/            # Visual assets
│   ├── audio/               # Sound effects
│   └── fonts/               # Cyberpunk typography
├── styles/
│   └── main.css             # Global styles
└── README.md
```

---

## Running the Experience

### Web Deployment (Recommended)

**GitHub Pages:**
1. Push your code to GitHub
2. Go to Settings → Pages
3. Select branch and root folder
4. Access at `https://[username].github.io/FIGAROA`

### Local Development

```bash
# Start local server with HTTPS
python -m http.server 8000

# Or use Live Server in VS Code
```

### VR Headset Setup

**Meta Quest 2:**
1. Enable Developer Mode
2. Navigate to deployed HTTPS URL
3. Click "Enter VR" button
4. Use controllers for navigation:
   - **Thumbstick**: Move forward/backward/strafe
   - **Trigger**: Select/interact
   - **Grip**: Secondary interactions

---

## Usage Examples

### Navigating the Realms

**Entering a Realm:**
1. Look at colored portal (red/green/blue)
2. Pull controller trigger to enter
3. Wait for realm to load (2-3 seconds)

**Interacting in Text Realm:**
1. Approach VR keyboard
2. Pull trigger to type
3. Submit your response
4. Data is permanently stored

**Recording in Audio Realm:**
1. Pull trigger to start recording
2. Speak into headset microphone
3. Release trigger to stop
4. Audio sphere appears with your voice

**Moving in Movement Realm:**
1. Use thumbstick to navigate
2. Watch your neon trail form behind you
3. Trails persist as data echoes

### Testing Individual Components

**Test VR Keyboard:**
```html
<!-- Add to vr-scene.html -->
<a-entity vr-keyboard position="0 1 -2"></a-entity>
```

**Test Audio Recording:**
```javascript
// Check browser console for audio capture
console.log(navigator.mediaDevices);
```

**Test Trail System:**
```html
<!-- Verify trail component -->
<a-entity trail-system></a-entity>
```

---

## Physical Installation Setup

### Space Requirements
- **Minimum**: 10ft × 5ft clear floor space
- **Recommended**: 12ft × 6ft for safety buffer
- **Height clearance**: 8ft minimum

### Equipment Checklist
- [ ] Meta Quest 2 headset (fully charged)
- [ ] Charging cable and power adapter
- [ ] WiFi connection (for Supabase sync)
- [ ] Boundary markers for play space
- [ ] Lens cleaning cloth
- [ ] Backup headset (recommended)

### Kiosk Mode Configuration

Configure Quest for auto-launch:
1. Enable Kiosk Mode in Meta Quest settings
2. Set FIGAROA as default app
3. Disable browser navigation controls
4. Set up automatic session reset

---

## Development Notes

### Known Issues & Solutions

**Controller movement not working:**
- Ensure `oculus-touch-controls` component is attached
- Check browser console for WebXR API errors
- Verify HTTPS connection

**Audio recording fails:**
- Grant microphone permissions in browser
- Check `navigator.mediaDevices.getUserMedia` support
- Verify HTTPS (required for media access)

**Supabase connection errors:**
- Verify API keys in `config.js`
- Check CORS settings in Supabase dashboard
- Ensure table schema matches code expectations

### Performance Optimization

**For smooth VR experience:**
- Keep total entity count under 500
- Use object pooling for trails/spheres
- Optimize textures to 1024×1024 or smaller
- Disable unnecessary physics calculations

### Browser Compatibility

| Browser | Desktop | VR Support |
|---------|---------|-----------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Safari | ⚠️ Limited | ❌ |
| Meta Quest Browser | N/A | ✅ Recommended |

---

## Troubleshooting

### Common Issues

**"Enter VR" button not appearing:**
```bash
# Check if page is served over HTTPS
# Verify WebXR browser support
# Try in Meta Quest browser
```

**Black screen in VR:**
```javascript
// Check console for errors
// Verify A-Frame version compatibility
// Clear browser cache (Ctrl+Shift+R)
```

**Data not persisting:**
```javascript
// Verify Supabase configuration
// Check network tab for API calls
// Confirm database permissions
```

**Realm transitions freeze:**
```javascript
// Use hard reload between scenes
// Check for duplicate entity IDs
// Verify scene-manager component loaded
```

---

## API Reference

### Custom A-Frame Components

**`portal-button`**
```html
<a-entity portal-button="target: #textRealm; color: #ff0000"></a-entity>
```

**`vr-keyboard`**
```html
<a-entity vr-keyboard="target: #inputField"></a-entity>
```

**`audio-recorder`**
```html
<a-entity audio-recorder="color: #00ff00"></a-entity>
```

**`trail-system`**
```html
<a-entity trail-system="color: #0000ff; length: 100"></a-entity>
```

---

## Contributing

This is a course final project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

---

## Credits & Acknowledgments

- **Course**: MS190 - Interactive Media Art
- **Institution**: [Your University Name]
- **Inspiration**: Moon Rider VR, The Matrix, Cyberpunk aesthetics
- **Libraries**: A-Frame community, Three.js contributors
- **Testing**: [Testers/Collaborators if any]

---

## License

This project is created for educational purposes as part of MS190 coursework.

---

## Contact

**Sophy Figaroa**
- GitHub: [@sophycodes](https://github.com/sophycodes)
- Project Link: [https://github.com/sophycodes/FIGAROA](https://github.com/sophycodes/FIGAROA)

---

## Future Enhancements

- [ ] Eye-tracking integration for gaze-based interactions
- [ ] Multi-user support for collaborative experiences
- [ ] Advanced AI detection models for better accuracy
- [ ] Mobile AR version for broader accessibility
- [ ] Gallery mode to revisit collected data echoes
- [ ] Export functionality for personal data archives

---

*"In the digital realm, every action leaves a trace. FIGAROA makes those traces visible, tangible, and unforgettable."*
