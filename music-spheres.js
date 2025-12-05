/**
 * music-spheres.js - Creates static music spheres with clickable audio
 */

console.log('=== music-spheres.js FILE LOADED ===');

/**
 * Music Spheres Component
 * Spawns cyan-green spheres that play music when clicked
 */
AFRAME.registerComponent('music-spheres', {
  schema: {
    count: {type: 'number', default: 8},
    radius: {type: 'number', default: 15},
    audioFiles: {type: 'array', default: []},
    playDuration: {type: 'number', default: 5000}  // Play for 5 seconds
  },
  
  init: function() {
    this.spheres = [];
    this.playingStates = new Map();
    this.stopTimers = new Map(); // Track stop timers for each sphere
    this.createMusicSpheres();
  },
  
  createMusicSpheres: function() {
    const data = this.data;
    
    // Default audio files if none provided
    const audioFiles = data.audioFiles.length > 0 ? data.audioFiles : [
      'assets/audio/BGA2.mp3',
      'assets/audio/augmentation.mp3',
      'assets/audio/AI/cyberpunk-AI.mp3',
      'assets/audio/Real/cyber-Real.mp3',
    ];
    
    for (let i = 0; i < data.count; i++) {
      this.createSphere(i, audioFiles[i % audioFiles.length]);
    }
  },
  
  createSphere: function(index, audioSrc) {
    const sphere = document.createElement('a-entity');
    
    // Random position in a circle around the center
    const angle = (index / this.data.count) * Math.PI * 2 + (Math.random() - 0.5);
    const distance = this.data.radius + (Math.random() - 0.5) * 5;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = 2 + Math.random() * 3;
    
    sphere.setAttribute('position', `${x} ${y} ${z}`);
    
    // Cyan-green sphere - SET ALL MATERIAL PROPERTIES AT ONCE
    const size = 0.8 + Math.random() * 0.4;
    sphere.setAttribute('geometry', {
      primitive: 'sphere',
      radius: size
    });
    
    // Set material properties all at once to avoid schemaChange errors
    sphere.setAttribute('material', {
      color: '#00ff7f',
      shader: 'flat',
      emissive: '#00ff7f',
      emissiveIntensity: 1.5,
      opacity: 0.7,
      transparent: true
    });
    
    // Make clickable
    sphere.setAttribute('class', 'clickable');
    
    // Add sound component - with preload
    sphere.setAttribute('sound', {
      src: audioSrc,
      loop: false,  // Changed to false - we'll control the play duration
      volume: 0.5,
      positional: true,
      refDistance: 5,
      maxDistance: 20,
      autoplay: false,
      preload: 'auto'  // Ensure sound is preloaded
    });
    
    // Idle floating animation
    sphere.setAttribute('animation', {
      property: 'position',
      to: `${x} ${y + 0.5} ${z}`,
      dir: 'alternate',
      loop: true,
      dur: 3000 + Math.random() * 2000,
      easing: 'easeInOutSine'
    });
    
    // Slow rotation
    sphere.setAttribute('animation__rotate', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: 20000 + Math.random() * 10000,
      easing: 'linear'
    });
    
    // Create orbital rings
    this.createOrbitalRings(sphere, size);
    
    // Store component reference for click handler
    const component = this;
    
    // Click handler to play/pause music
    sphere.addEventListener('click', function(evt) {
      console.log('Sphere clicked!');
      
      // Wait for sound to be ready
      const soundComponent = sphere.components.sound;
      if (!soundComponent) {
        console.warn('Sound component not ready');
        return;
      }
      
      const isPlaying = component.playingStates.get(sphere) || false;
      
      if (isPlaying) {
        // Stop the music
        component.stopSphere(sphere);
      } else {
        // Play the music
        component.playSphere(sphere);
      }
    });
    
    // Hover effect
    sphere.addEventListener('mouseenter', () => {
      sphere.setAttribute('scale', '1.15 1.15 1.15');
    });
    
    sphere.addEventListener('mouseleave', () => {
      sphere.setAttribute('scale', '1 1 1');
    });
    
    this.el.appendChild(sphere);
    this.spheres.push(sphere);
  },
  
  playSphere: function(sphere) {
    const soundComponent = sphere.components.sound;
    
    // Check if sound is loaded
    if (!soundComponent || !soundComponent.loaded) {
      console.warn('Sound not loaded yet, waiting...');
      
      // Wait for sound to load, then play
      sphere.addEventListener('sound-loaded', () => {
        this.playSphere(sphere);
      }, { once: true });
      
      return;
    }
    
    // Play the sound
    soundComponent.playSound();
    
    // Update visual state - USE setAttribute with object for material
    sphere.setAttribute('material', {
      color: '#00ff7f',
      shader: 'flat',
      emissive: '#00ff7f',
      emissiveIntensity: 3,
      opacity: 1,
      transparent: true
    });
    
    // Add pulsing animation
    sphere.setAttribute('animation__pulse', {
      property: 'scale',
      to: '1.2 1.2 1.2',
      dir: 'alternate',
      loop: true,
      dur: 500,
      easing: 'easeInOutQuad'
    });
    
    // Update state
    this.playingStates.set(sphere, true);
    
    // Set timer to stop after playDuration
    const timer = setTimeout(() => {
      this.stopSphere(sphere);
    }, this.data.playDuration);
    
    this.stopTimers.set(sphere, timer);
    
    console.log(`Music playing for ${this.data.playDuration / 1000} seconds`);
  },
  
  stopSphere: function(sphere) {
    const soundComponent = sphere.components.sound;
    
    if (soundComponent) {
      soundComponent.pauseSound();
    }
    
    // Clear any existing timer
    const timer = this.stopTimers.get(sphere);
    if (timer) {
      clearTimeout(timer);
      this.stopTimers.delete(sphere);
    }
    
    // Dim the sphere - USE setAttribute with object
    sphere.setAttribute('material', {
      color: '#00ff7f',
      shader: 'flat',
      emissive: '#00ff7f',
      emissiveIntensity: 1.5,
      opacity: 0.7,
      transparent: true
    });
    
    // Remove pulse animation
    sphere.removeAttribute('animation__pulse');
    
    this.playingStates.set(sphere, false);
    console.log('Music stopped');
  },

  tick: function() {
    // Get player position
    const player = document.querySelector('#player');
    if (!player) return;
    
    const playerPos = player.object3D.getWorldPosition(new THREE.Vector3());
    
    // Check distance for each playing sphere
    this.playingStates.forEach((isPlaying, sphere) => {
      if (isPlaying) {
        const spherePos = sphere.object3D.getWorldPosition(new THREE.Vector3());
        const distance = playerPos.distanceTo(spherePos);
        
        // If too far away, stop the music
        if (distance > 25) {  // Increased from 5 to 25 to match maxDistance
          this.stopSphere(sphere);
          console.log('Music stopped - player too far away');
        }
      }
    });
  },
  
  createOrbitalRings: function(parent, sphereSize) {
    // Create 2 orbiting rings around the sphere
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('a-ring');
      const ringSize = sphereSize + 0.3 + (i * 0.2);
      
      ring.setAttribute('radius-inner', ringSize);
      ring.setAttribute('radius-outer', ringSize + 0.05);
      ring.setAttribute('color', '#00ff7f');
      ring.setAttribute('opacity', '0.4');
      ring.setAttribute('material', 'shader: flat; side: double');
      
      // Random rotation
      const rotX = Math.random() * 360;
      const rotY = Math.random() * 360;
      ring.setAttribute('rotation', `${rotX} ${rotY} 0`);
      
      // Spinning animation
      ring.setAttribute('animation', {
        property: 'rotation',
        to: `${rotX + 360} ${rotY} 0`,
        loop: true,
        dur: 8000 + i * 2000,
        easing: 'linear'
      });
      
      parent.appendChild(ring);
    }
  },
  
  pause: function() {
    // Stop all playing spheres when scene is paused
    this.spheres.forEach(sphere => {
      this.stopSphere(sphere);
    });
  },
  
  remove: function() {
    // Stop all audio and clear timers
    this.stopTimers.forEach(timer => clearTimeout(timer));
    this.stopTimers.clear();
    
    this.spheres.forEach(sphere => {
      if (sphere.components.sound) {
        sphere.components.sound.stopSound();
      }
      if (sphere.parentNode) {
        sphere.parentNode.removeChild(sphere);
      }
    });
  }
});

console.log('music-spheres component registered');