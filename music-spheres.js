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
    count: {type: 'number', default: 8},      // Number of music spheres
    radius: {type: 'number', default: 15},    // Spawn radius from center
    audioFiles: {type: 'array', default: []}  // Array of audio file URLs
  },
  
  init: function() {
    this.spheres = [];
    this.playingStates = new Map(); // Track which spheres are playing
    this.createMusicSpheres();
  },
  
  createMusicSpheres: function() {
    const data = this.data;
    
    // Default audio files if none provided
    const audioFiles = data.audioFiles.length > 0 ? data.audioFiles : [
      'audio/cyber.mp3',
      'audio/augmentation.mp3'
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
    const y = 2 + Math.random() * 3; // Random height between 2-5
    
    sphere.setAttribute('position', `${x} ${y} ${z}`);
    
    // Cyan-green sphere (different from voice spheres)
    const size = 0.8 + Math.random() * 0.4;
    sphere.setAttribute('geometry', {
      primitive: 'sphere',
      radius: size
    });
    
    sphere.setAttribute('material', {
      color: '#00ff7f',  // Cyan-green
      shader: 'flat',
      emissive: '#00ff7f',
      emissiveIntensity: 1.5,
      opacity: 0.7,
      transparent: true
    });
    
    // Make clickable
    sphere.setAttribute('class', 'clickable');
    
    // Add sound component
    sphere.setAttribute('sound', {
      src: audioSrc,
      loop: true,
      volume: 0.5,
      positional: true,
      refDistance: 5,
      maxDistance: 20
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
    
    // Create orbital rings around sphere
    this.createOrbitalRings(sphere, size);
    
    // Store component reference for click handler
    const component = this;
    
    // Click handler to play/pause music
    sphere.addEventListener('click', function() {
      console.log('Sphere clicked!');
      const soundComponent = sphere.components.sound;
      const isPlaying = component.playingStates.get(sphere) || false;
      
      if (isPlaying) {
        soundComponent.pauseSound();
        // Dim the sphere
        sphere.setAttribute('material', 'emissiveIntensity', 1.5);
        sphere.setAttribute('material', 'opacity', 0.7);
        // Remove pulse animation
        sphere.removeAttribute('animation__pulse');
        
        component.playingStates.set(sphere, false);
        console.log('Music paused');
      } else {
        soundComponent.playSound();
        // Brighten the sphere
        sphere.setAttribute('material', 'emissiveIntensity', 3);
        sphere.setAttribute('material', 'opacity', 1);
        
        // Add pulsing animation when playing
        sphere.setAttribute('animation__pulse', {
          property: 'scale',
          to: '1.2 1.2 1.2',
          dir: 'alternate',
          loop: true,
          dur: 500,
          easing: 'easeInOutQuad'
        });
        
        component.playingStates.set(sphere, true);
        console.log('Music playing');
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
        if (distance > 5) {
          const soundComponent = sphere.components.sound;
          if (soundComponent) {
            soundComponent.pauseSound();
            
            // Dim the sphere
            sphere.setAttribute('material', 'emissiveIntensity', 1.5);
            sphere.setAttribute('material', 'opacity', 0.7);
            
            // Remove pulse animation
            sphere.removeAttribute('animation__pulse');
            
            // Update state
            this.playingStates.set(sphere, false);
            
            console.log('Music stopped - player too far away');
          }
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
  
  remove: function() {
    // Stop all audio and remove spheres
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