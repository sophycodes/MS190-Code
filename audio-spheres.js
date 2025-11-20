/**
 * audio-spheres.js - Creates neon green spheres that react to user's voice
 */

console.log('=== audio-spheres.js FILE LOADED ===');

/**
 * Audio Reactive Spheres Component
 * Spawns green spheres when user makes noise, with floating animation
 */
AFRAME.registerComponent('audio-spheres', {
  schema: {
    sensitivity: {type: 'number', default: 50}, // Microphone sensitivity threshold
    maxSpheres: {type: 'number', default: 20}   // Maximum number of spheres
  },
  
  init: function() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.spheres = [];
    this.isListening = false;
    
    // Request microphone access
    this.setupAudio();
    
    // Check audio levels periodically
    this.tick = AFRAME.utils.throttleTick(this.tick, 100, this);
  },
  
  setupAudio: async function() {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      // Connect microphone
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      // Create data array for audio analysis
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isListening = true;
      console.log('Audio listening enabled!');
      
    } catch (error) {
      console.warn('Microphone access denied:', error);
    }
  },
  
  tick: function() {
    if (!this.isListening || !this.analyser) return;
    
    // Get current audio level
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    
    // If sound detected above threshold, spawn sphere
    if (average > this.data.sensitivity) {
      this.spawnSphere(average);
    }
  },
  
  spawnSphere: function(volume) {
    // Don't spawn if at max capacity
    if (this.spheres.length >= this.data.maxSpheres) {
      // Remove oldest sphere
      const oldSphere = this.spheres.shift();
      oldSphere.parentNode.removeChild(oldSphere);
    }
    
    // Create sphere entity
    const sphere = document.createElement('a-entity');
    
    // Random position around user
    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 5;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = Math.random() * 2 + 1;
    
    sphere.setAttribute('position', `${x} ${y} ${z}`);
    
    // Create glowing green sphere
    const size = 0.3 + (volume / 255) * 0.5; // Size based on volume
    sphere.setAttribute('geometry', {
      primitive: 'sphere',
      radius: size
    });
    sphere.setAttribute('material', {
      color: '#00ff00',
      shader: 'flat',
      emissive: '#00ff00',
      emissiveIntensity: 2,
      opacity: 0.8,
      transparent: true
    });
    
    // Add floating animation
    sphere.setAttribute('animation', {
      property: 'position',
      to: `${x} ${y + 1} ${z}`,
      dir: 'alternate',
      loop: true,
      dur: 2000 + Math.random() * 1000,
      easing: 'easeInOutSine'
    });
    
    // Add pulsing animation
    sphere.setAttribute('animation__scale', {
      property: 'scale',
      to: '1.2 1.2 1.2',
      dir: 'alternate',
      loop: true,
      dur: 1000,
      easing: 'easeInOutQuad'
    });
    
    // Create sound wave rings around sphere
    this.createSoundWaves(sphere, x, y, z);
    
    // Add to scene and track it
    this.el.sceneEl.appendChild(sphere);
    this.spheres.push(sphere);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (sphere.parentNode) {
        sphere.parentNode.removeChild(sphere);
        const index = this.spheres.indexOf(sphere);
        if (index > -1) this.spheres.splice(index, 1);
      }
    }, 10000);
  },
  
  createSoundWaves: function(parent, x, y, z) {
    // Create 3 expanding rings
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('a-ring');
      ring.setAttribute('position', `${x} ${y} ${z}`);
      ring.setAttribute('radius-inner', '0.3');
      ring.setAttribute('radius-outer', '0.4');
      ring.setAttribute('color', '#00ff00');
      ring.setAttribute('opacity', '0.6');
      ring.setAttribute('material', 'shader: flat; side: double');
      
      // Expanding animation
      ring.setAttribute('animation', {
        property: 'scale',
        from: '1 1 1',
        to: '3 3 3',
        dur: 2000,
        easing: 'easeOutQuad',
        loop: true,
        delay: i * 500
      });
      
      // Fade out animation
      ring.setAttribute('animation__opacity', {
        property: 'material.opacity',
        from: '0.6',
        to: '0',
        dur: 2000,
        easing: 'linear',
        loop: true,
        delay: i * 500
      });
      
      this.el.sceneEl.appendChild(ring);
      
      // Remove after 10 seconds
      setTimeout(() => {
        if (ring.parentNode) ring.parentNode.removeChild(ring);
      }, 10000);
    }
  },
  
  remove: function() {
    // Clean up audio resources
    if (this.microphone) this.microphone.disconnect();
    if (this.audioContext) this.audioContext.close();
    
    // Remove all spheres
    this.spheres.forEach(sphere => {
      if (sphere.parentNode) sphere.parentNode.removeChild(sphere);
    });
  }
});

console.log('audio-spheres component registered');