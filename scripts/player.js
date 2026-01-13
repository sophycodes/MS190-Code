/**
 * player.js - Player avatar and transformation controller
 * Manages pixelated hands and visual distortion based on data collection
 */

const Player = {
  strength: 100, // 0-100, represents player's "digital integrity"
  brightness: 1.0, // 0-1, controls glow/brightness
  leftHand: null,
  rightHand: null,
  
  init: function() {
    console.log('Player initialized');
    
    this.leftHand = document.querySelector('#leftHand');
    this.rightHand = document.querySelector('#rightHand');
    
    // Apply pixelated effect to hands
    this.pixelateHands();
    
    // Add glow effect
    this.updateGlow();
  },
  
  pixelateHands: function() {
    // Make hands look more digital/pixelated
    if (this.leftHand) {
      this.leftHand.setAttribute('hand-controls', {
        hand: 'left',
        handModelStyle: 'lowPoly',
        color: '#00FF00'
      });
    }
    
    if (this.rightHand) {
      this.rightHand.setAttribute('hand-controls', {
        hand: 'right',
        handModelStyle: 'lowPoly',
        color: '#00FF00'
      });
    }
  },
  
  strengthen: function() {
    // Collecting positive data makes player brighter and stronger
    this.strength = Math.min(100, this.strength + 5);
    this.brightness = Math.min(1.0, this.brightness + 0.05);
    
    this.updateGlow();
    
    console.log(`Player strengthened: ${this.strength}%`);
  },
  
  weaken: function() {
    // Collecting negative data weakens player
    this.strength = Math.max(0, this.strength - 10);
    this.brightness = Math.max(0.2, this.brightness - 0.1);
    
    this.updateGlow();
    
    console.log(`Player weakened: ${this.strength}%`);
  },
  
  distort: function(distortionLevel) {
    // 0-100, represents how distorted the player becomes
    // Higher distortion = less human, more data-like
    
    const normalizedDistortion = distortionLevel / 100;
    
    // Change hand colors based on distortion
    const greenValue = Math.floor(255 * (1 - normalizedDistortion));
    const redValue = Math.floor(255 * normalizedDistortion);
    const color = `#${redValue.toString(16).padStart(2, '0')}${greenValue.toString(16).padStart(2, '0')}00`;
    
    if (this.leftHand) {
      this.leftHand.setAttribute('hand-controls', 'color', color);
    }
    
    if (this.rightHand) {
      this.rightHand.setAttribute('hand-controls', 'color', color);
    }
    
    // Add glitch effect at high distortion levels
    if (distortionLevel > 50) {
      this.addGlitchEffect();
    }
    
    console.log(`Player distortion: ${distortionLevel}%`);
  },
  
  updateGlow: function() {
    // Update the glow/brightness of player's hands
    const glowIntensity = this.brightness;
    
    // You can add emission or additional lighting here
    // For now, we'll adjust the opacity slightly
    if (this.leftHand) {
      this.leftHand.setAttribute('opacity', 0.8 + (glowIntensity * 0.2));
    }
    
    if (this.rightHand) {
      this.rightHand.setAttribute('opacity', 0.8 + (glowIntensity * 0.2));
    }
  },
  
  addGlitchEffect: function() {
    // Random position jitter for glitch effect
    const glitchInterval = setInterval(() => {
      if (VRScene.playerTransformation < 50) {
        clearInterval(glitchInterval);
        return;
      }
      
      const jitter = 0.02;
      
      if (this.leftHand) {
        const currentPos = this.leftHand.getAttribute('position');
        this.leftHand.setAttribute('position', {
          x: currentPos.x + (Math.random() * jitter - jitter/2),
          y: currentPos.y + (Math.random() * jitter - jitter/2),
          z: currentPos.z + (Math.random() * jitter - jitter/2)
        });
      }
      
      if (this.rightHand) {
        const currentPos = this.rightHand.getAttribute('position');
        this.rightHand.setAttribute('position', {
          x: currentPos.x + (Math.random() * jitter - jitter/2),
          y: currentPos.y + (Math.random() * jitter - jitter/2),
          z: currentPos.z + (Math.random() * jitter - jitter/2)
        });
      }
    }, 100);
  },
  
  reset: function() {
    console.log('Resetting player...');
    
    this.strength = 100;
    this.brightness = 1.0;
    
    // Reset hand colors
    if (this.leftHand) {
      this.leftHand.setAttribute('hand-controls', 'color', '#00FF00');
      this.leftHand.setAttribute('position', '-0.3 0 -0.5');
      this.leftHand.setAttribute('opacity', '1');
    }
    
    if (this.rightHand) {
      this.rightHand.setAttribute('hand-controls', 'color', '#00FF00');
      this.rightHand.setAttribute('position', '0.3 0 -0.5');
      this.rightHand.setAttribute('opacity', '1');
    }
  },
  
  // Helper method to get player's current position
  getPosition: function() {
    const player = document.querySelector('#player');
    return player.getAttribute('position');
  }
};