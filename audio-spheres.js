/**
 * audio-spheres.js - Creates neon green spheres that record and playback user's voice
 * WITH SUPABASE INTEGRATION - Auto-saves recordings to database
 * 
 * When user speaks: Records 10 seconds of audio and stores in a sphere
 * When user clicks sphere: Plays back the recorded audio
 */

console.log('=== audio-spheres.js FILE LOADED ===');

// Storage bucket name (specific to audio-spheres)
const STORAGE_BUCKET = 'audio-recordings';

AFRAME.registerComponent('audio-spheres', {
  schema: {
    sensitivity: {type: 'number', default: 35},   // Microphone sensitivity threshold
    maxSpheres: {type: 'number', default: 15},    // Maximum number of spheres
    recordDuration: {type: 'number', default: 10} // Recording duration in seconds
  },
  
  init: function() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.spheres = [];
    this.isListening = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioStream = null;
    
    // Request microphone access
    this.setupAudio();
    
    // Load saved spheres from Supabase
    this.loadSavedSpheres();
    
    // Check audio levels periodically
    this.tick = AFRAME.utils.throttleTick(this.tick, 100, this);
  },
  
  setupAudio: async function() {
    try {
      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context for analysis
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      // Connect microphone for level detection
      this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
      this.microphone.connect(this.analyser);
      
      // Create data array for audio analysis
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isListening = true;
      console.log('Audio listening enabled! Speak to create recording spheres.');
      
    } catch (error) {
      console.warn('Microphone access denied:', error);
    }
  },
  
  loadSavedSpheres: async function() {
    try {
      console.log('Loading saved audio spheres from Supabase...');
      
      // Fetch all saved spheres
      const response = await fetch(`${SUPABASE_URL}/rest/v1/audio_spheres?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to load spheres:', response.status);
        return;
      }
      
      const savedSpheres = await response.json();
      console.log('Found', savedSpheres.length, 'saved spheres');
      
      // Recreate each saved sphere
      for (const data of savedSpheres) {
        await this.recreateSphere(data);
      }
      
    } catch (error) {
      console.error('Error loading saved spheres:', error);
    }
  },
  
  recreateSphere: async function(data) {
    // Create sphere entity
    const sphere = document.createElement('a-entity');
    sphere.hasAudio = true;
    sphere.audioUrl = data.audio_url;
    sphere.isPlaying = false;
    sphere.supabaseId = data.id;
    
    // Set saved position
    sphere.setAttribute('position', `${data.position_x} ${data.position_y} ${data.position_z}`);
    sphere.setAttribute('class', 'clickable');
    
    // Create green sphere (ready to play)
    sphere.setAttribute('geometry', {
      primitive: 'sphere',
      radius: 0.4
    });
    sphere.setAttribute('material', {
      color: '#00ff00',
      shader: 'flat',
      opacity: 0.9,
      transparent: true
    });
    
    // Add gentle float animation
    sphere.setAttribute('animation', {
      property: 'position',
      to: `${data.position_x} ${data.position_y + 0.5} ${data.position_z}`,
      dir: 'alternate',
      loop: true,
      dur: 2000 + Math.random() * 1000,
      easing: 'easeInOutSine'
    });
    
    // Add gentle pulse
    sphere.setAttribute('animation__pulse', {
      property: 'scale',
      from: '1 1 1',
      to: '1.1 1.1 1.1',
      dir: 'alternate',
      loop: true,
      dur: 1500,
      easing: 'easeInOutQuad'
    });
    
    // Add orbiting rings
    this.createOrbitRings(sphere, data.position_x, data.position_y, data.position_z);
    
    // Add play icon text
    const playIcon = document.createElement('a-text');
    playIcon.setAttribute('value', '▶');
    playIcon.setAttribute('align', 'center');
    playIcon.setAttribute('color', '#ffffff');
    playIcon.setAttribute('width', '3');
    playIcon.setAttribute('position', '0 0 0.5');
    sphere.appendChild(playIcon);
    sphere.playIcon = playIcon;
    
    // Add click handler for playback
    const self = this;
    sphere.addEventListener('click', function(evt) {
      evt.stopPropagation();
      self.playAudio(sphere);
    });
    
    // Add hover effects
    sphere.addEventListener('mouseenter', function() {
      sphere.setAttribute('scale', '1.3 1.3 1.3');
    });
    
    sphere.addEventListener('mouseleave', function() {
      sphere.setAttribute('scale', '1 1 1');
    });
    
    // Add to scene and track
    this.el.appendChild(sphere);
    this.spheres.push(sphere);
    
    console.log('Recreated sphere at', data.position_x, data.position_y, data.position_z);
  },
  
  tick: function() {
    if (!this.isListening || !this.analyser || this.isRecording) return;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    
    // DEBUG - log audio level every second
    if (!this.lastLogTime || Date.now() - this.lastLogTime > 1000) {
      console.log('Audio level:', average, '/ Threshold:', this.data.sensitivity);
      this.lastLogTime = Date.now();
    }
    
    if (average > this.data.sensitivity) {
      this.startRecording();
    }
  },
  
  startRecording: function() {
    if (this.isRecording || !this.audioStream) return;

    // Check if audio stream is still active
    const tracks = this.audioStream.getAudioTracks();
    console.log('Audio tracks:', tracks.length, 'Track state:', tracks[0]?.readyState);
    
    if (tracks.length === 0 || tracks[0].readyState !== 'live') {
      console.error('Audio stream not active, re-requesting...');
      this.setupAudio();
      return;
    }
    
    this.isRecording = true;
    console.log('>>> RECORDING STARTED (10 seconds) <<<');
    
    // Create visual indicator sphere immediately
    const sphere = this.createRecordingSphere();
    
    // Setup media recorder
    const chunks = [];
    
    // Try different mime types for browser compatibility
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/ogg';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser choose
        }
      }
    }
    console.log('Using mime type:', mimeType || 'default');
    
    const options = mimeType ? { mimeType: mimeType } : {};
    this.mediaRecorder = new MediaRecorder(this.audioStream, options);
    
    this.mediaRecorder.ondataavailable = (event) => {
      console.log('Data available, size:', event.data.size);
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      console.log('>>> RECORDING STOPPED, chunks:', chunks.length, '<<<');
      
      if (chunks.length === 0) {
        console.error('No audio data recorded!');
        this.isRecording = false;
        return;
      }
      
      // Create audio blob from recorded chunks
      const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      console.log('Audio blob size:', audioBlob.size);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Store audio URL in the sphere
      sphere.audioUrl = audioUrl;
      sphere.audioBlob = audioBlob;
      sphere.hasAudio = true;
      
      // Update sphere appearance to show it has audio
      this.finalizeSphere(sphere);
      
      // Allow new recordings after a short delay
      setTimeout(() => {
        this.isRecording = false;
      }, 2000);
    };
    
    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      this.isRecording = false;
    };
    
    // Start recording - use timeslice to get data periodically
    this.mediaRecorder.start(1000); // Collect data every 1 second
    console.log('MediaRecorder started, state:', this.mediaRecorder.state);
    
    // Stop recording after specified duration
    setTimeout(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }, this.data.recordDuration * 1000);
  },
  
  createRecordingSphere: function() {
    // Remove oldest sphere if at max capacity
    if (this.spheres.length >= this.data.maxSpheres) {
      const oldSphere = this.spheres.shift();
      if (oldSphere.audioUrl) {
        URL.revokeObjectURL(oldSphere.audioUrl);
      }
      oldSphere.parentNode.removeChild(oldSphere);
    }
    
    // Create sphere entity
    const sphere = document.createElement('a-entity');
    sphere.hasAudio = false;
    sphere.audioUrl = null;
    sphere.audioBlob = null;
    sphere.isPlaying = false;
    
    // Random position around user
    const angle = Math.random() * Math.PI * 2;
    const distance = 4 + Math.random() * 6;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = 1.5 + Math.random() * 3;
    
    sphere.setAttribute('position', `${x} ${y} ${z}`);
    sphere.setAttribute('class', 'clickable');
    
    // Create pulsing recording sphere (red while recording)
    sphere.setAttribute('geometry', {
      primitive: 'sphere',
      radius: 0.4
    });
    sphere.setAttribute('material', {
      color: '#ff0000',
      shader: 'flat',
      opacity: 0.8,
      transparent: true
    });
    
    // Recording pulse animation
    sphere.setAttribute('animation', {
      property: 'scale',
      from: '1 1 1',
      to: '1.3 1.3 1.3',
      dir: 'alternate',
      loop: true,
      dur: 500,
      easing: 'easeInOutQuad'
    });
    
    // Add recording indicator rings
    this.createRecordingRings(sphere, x, y, z);
    
    // Add to scene
    this.el.appendChild(sphere);
    this.spheres.push(sphere);
    
    return sphere;
  },
  
  createRecordingRings: function(sphere, x, y, z) {
    // Create pulsing red rings while recording
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('a-ring');
      ring.setAttribute('position', `${x} ${y} ${z}`);
      ring.setAttribute('radius-inner', '0.35');
      ring.setAttribute('radius-outer', '0.45');
      ring.setAttribute('color', '#ff0000');
      ring.setAttribute('opacity', '0.6');
      ring.setAttribute('material', 'shader: flat; side: double');
      ring.setAttribute('rotation', `${Math.random() * 360} ${Math.random() * 360} ${Math.random() * 360}`);
      
      // Expanding animation
      ring.setAttribute('animation', {
        property: 'scale',
        from: '1 1 1',
        to: '2.5 2.5 2.5',
        dur: 1500,
        easing: 'easeOutQuad',
        loop: true,
        delay: i * 400
      });
      
      // Fade out animation
      ring.setAttribute('animation__opacity', {
        property: 'material.opacity',
        from: '0.6',
        to: '0',
        dur: 1500,
        easing: 'linear',
        loop: true,
        delay: i * 400
      });
      
      // Store reference and add to scene
      sphere.recordingRings = sphere.recordingRings || [];
      sphere.recordingRings.push(ring);
      this.el.appendChild(ring);
    }
  },
  
  finalizeSphere: function(sphere) {
    // Remove recording rings
    if (sphere.recordingRings) {
      sphere.recordingRings.forEach(ring => {
        if (ring.parentNode) ring.parentNode.removeChild(ring);
      });
      sphere.recordingRings = [];
    }
    
    // Get sphere position for the permanent rings
    const pos = sphere.getAttribute('position');
    
    // Change to green (ready to play)
    sphere.setAttribute('material', {
      color: '#00ff00',
      shader: 'flat',
      opacity: 0.9,
      transparent: true
    });
    
    // Change animation to gentle float
    sphere.removeAttribute('animation');
    sphere.setAttribute('animation', {
      property: 'position',
      to: `${pos.x} ${pos.y + 0.5} ${pos.z}`,
      dir: 'alternate',
      loop: true,
      dur: 2000 + Math.random() * 1000,
      easing: 'easeInOutSine'
    });
    
    // Add gentle pulse
    sphere.setAttribute('animation__pulse', {
      property: 'scale',
      from: '1 1 1',
      to: '1.1 1.1 1.1',
      dir: 'alternate',
      loop: true,
      dur: 1500,
      easing: 'easeInOutQuad'
    });
    
    // Add orbiting rings
    this.createOrbitRings(sphere, pos.x, pos.y, pos.z);
    
    // Add play icon text
    const playIcon = document.createElement('a-text');
    playIcon.setAttribute('value', '▶');
    playIcon.setAttribute('align', 'center');
    playIcon.setAttribute('color', '#ffffff');
    playIcon.setAttribute('width', '3');
    playIcon.setAttribute('position', '0 0 0.5');
    sphere.appendChild(playIcon);
    sphere.playIcon = playIcon;
    
    // Add click handler for playback
    const self = this;
    sphere.addEventListener('click', function(evt) {
      evt.stopPropagation();
      console.log('Sphere clicked! hasAudio:', sphere.hasAudio, 'audioUrl:', sphere.audioUrl);
      self.playAudio(sphere);
    });
    
    // Add hover effects
    sphere.addEventListener('mouseenter', function() {
      sphere.setAttribute('scale', '1.3 1.3 1.3');
    });
    
    sphere.addEventListener('mouseleave', function() {
      sphere.setAttribute('scale', '1 1 1');
    });
    
    console.log('Sphere ready! Click to play recording.');
    
    // Save to Supabase
    this.saveSphereToSupabase(sphere);
  },
  
  saveSphereToSupabase: async function(sphere) {
    try {
      const pos = sphere.getAttribute('position');
      
      // Generate unique filename
      const filename = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
      
      console.log('Uploading audio to Supabase Storage...');
      
      // Upload audio to Supabase Storage
      const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': sphere.audioBlob.type
        },
        body: sphere.audioBlob
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Failed to upload audio:', uploadResponse.status, errorText);
        return;
      }
      
      console.log('Audio uploaded successfully!');
      
      // Get public URL for the uploaded audio
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
      
      console.log('Saving sphere metadata to database...');
      
      // Save sphere metadata to database
      const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/audio_spheres`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          audio_url: publicUrl,
          position_x: pos.x,
          position_y: pos.y,
          position_z: pos.z
        })
      });
      
      if (dbResponse.ok) {
        const savedData = await dbResponse.json();
        sphere.supabaseId = savedData[0].id;
        // Update sphere to use the public URL instead of blob URL
        sphere.audioUrl = publicUrl;
        console.log('✅ Sphere saved to Supabase! ID:', sphere.supabaseId);
      } else {
        const errorText = await dbResponse.text();
        console.error('Failed to save sphere metadata:', dbResponse.status, errorText);
      }
      
    } catch (error) {
      console.error('Error saving sphere to Supabase:', error);
    }
  },
  
  createOrbitRings: function(sphere, x, y, z) {
    // Create orbiting decorative rings
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('a-torus');
      ring.setAttribute('position', `${x} ${y} ${z}`);
      ring.setAttribute('radius', '0.6');
      ring.setAttribute('radius-tubular', '0.02');
      ring.setAttribute('color', '#00ff00');
      ring.setAttribute('material', 'shader: flat; opacity: 0.5');
      
      // Rotating animation
      ring.setAttribute('animation', {
        property: 'rotation',
        from: `${i * 90} 0 0`,
        to: `${i * 90 + 360} 360 0`,
        dur: 5000 + i * 2000,
        easing: 'linear',
        loop: true
      });
      
      sphere.orbitRings = sphere.orbitRings || [];
      sphere.orbitRings.push(ring);
      this.el.appendChild(ring);
    }
  },
  
  playAudio: function(sphere) {
    console.log('playAudio called - hasAudio:', sphere.hasAudio, 'audioUrl:', sphere.audioUrl, 'isPlaying:', sphere.isPlaying);
    
    if (!sphere.hasAudio || !sphere.audioUrl) {
      console.log('No audio to play');
      return;
    }
    
    if (sphere.isPlaying) {
      console.log('Already playing, stopping...');
      if (sphere.currentAudio) {
        sphere.currentAudio.pause();
        sphere.currentAudio = null;
      }
      sphere.isPlaying = false;
      sphere.setAttribute('material', 'color', '#00ff00');
      if (sphere.playIcon) sphere.playIcon.setAttribute('value', '▶');
      return;
    }
    
    console.log('>>> PLAYING AUDIO <<<');
    sphere.isPlaying = true;
    
    // Visual feedback - stays green now!
    sphere.setAttribute('material', 'color', '#00ff00');
    if (sphere.playIcon) {
      sphere.playIcon.setAttribute('value', '◼');
    }
    
    // Create sound waves while playing
    const pos = sphere.getAttribute('position');
    this.createPlaybackWaves(pos.x, pos.y, pos.z);
    
    // Create and play audio
    const audio = new Audio(sphere.audioUrl);
    sphere.currentAudio = audio;
    
    audio.onended = () => {
      console.log('>>> AUDIO FINISHED <<<');
      sphere.isPlaying = false;
      sphere.setAttribute('material', 'color', '#00ff00');
      if (sphere.playIcon) {
        sphere.playIcon.setAttribute('value', '▶');
      }
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      sphere.isPlaying = false;
      sphere.setAttribute('material', 'color', '#00ff00');
    };
    
    audio.play().then(() => {
      console.log('Audio playing successfully!');
    }).catch(e => {
      console.error('Failed to play audio:', e);
      sphere.isPlaying = false;
      sphere.setAttribute('material', 'color', '#00ff00');
    });
  },
  
  createPlaybackWaves: function(x, y, z) {
    // Create expanding sound wave rings during playback (GREEN not yellow!)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const ring = document.createElement('a-ring');
        ring.setAttribute('position', `${x} ${y} ${z}`);
        ring.setAttribute('radius-inner', '0.5');
        ring.setAttribute('radius-outer', '0.6');
        ring.setAttribute('color', '#00ff00');  // Changed from yellow to green!
        ring.setAttribute('opacity', '0.8');
        ring.setAttribute('material', 'shader: flat; side: double');
        
        // Expanding animation
        ring.setAttribute('animation', {
          property: 'scale',
          from: '1 1 1',
          to: '4 4 4',
          dur: 2000,
          easing: 'easeOutQuad'
        });
        
        // Fade out animation
        ring.setAttribute('animation__opacity', {
          property: 'material.opacity',
          from: '0.8',
          to: '0',
          dur: 2000,
          easing: 'linear'
        });
        
        this.el.appendChild(ring);
        
        // Remove after animation
        setTimeout(() => {
          if (ring.parentNode) ring.parentNode.removeChild(ring);
        }, 2000);
        
      }, i * 400);
    }
  },
  
  remove: function() {
    // Clean up audio resources
    if (this.microphone) this.microphone.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    // Clean up spheres and their audio URLs
    this.spheres.forEach(sphere => {
      if (sphere.audioUrl) {
        URL.revokeObjectURL(sphere.audioUrl);
      }
      if (sphere.orbitRings) {
        sphere.orbitRings.forEach(ring => {
          if (ring.parentNode) ring.parentNode.removeChild(ring);
        });
      }
      if (sphere.parentNode) sphere.parentNode.removeChild(sphere);
    });
  }
});

console.log('audio-spheres component registered with Supabase integration!');