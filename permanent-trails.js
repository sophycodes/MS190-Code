// ============================================
// PERMANENT MOVEMENT TRAIL
// Blocks stay forever
// ============================================

AFRAME.registerComponent('permanent-trail', {
  schema: {
    color: { type: 'color', default: '#00ffff' },
    trailInterval: { type: 'number', default: 0.3 },
    blockSize: { type: 'number', default: 0.15 },
    heightOffset: { type: 'number', default: 0.05 },
    maxBlocks: { type: 'number', default: 1000 }
  },

  init: function() {
    console.log('🔵 PERMANENT TRAIL: Initializing...');
    
    this.lastPosition = new THREE.Vector3();
    this.timeSinceLastBlock = 0;
    this.trailBlocks = [];
    this.blockCount = 0;
    
    this.camera = document.querySelector('[camera]');
    
    if (this.camera) {
      this.lastPosition.copy(this.camera.object3D.position);
      console.log('✓ Camera found at:', this.lastPosition);
    } else {
      console.error('✗ Camera NOT found!');
    }
    
    console.log('Trail settings:', this.data);
  },
  
  checkIfMovementRealmActive: function() {
    // Check for movement scene by ID or data-scene attribute
    const movementScene = document.querySelector('#movement-scene') ||
                          document.querySelector('#movement-realm') || 
                          document.querySelector('#movement') ||
                          document.querySelector('[data-scene="movement"]');
    
    if (movementScene && movementScene.object3D) {
      return movementScene.object3D.visible;
    }
    
    // Fallback - check if other realms are visible
    const textScene = document.querySelector('#text-scene');
    const audioScene = document.querySelector('#audio-scene');
    
    if (textScene && textScene.object3D && textScene.object3D.visible) {
      return false;
    }
    if (audioScene && audioScene.object3D && audioScene.object3D.visible) {
      return false;
    }
    
    return true; // Default to active
  },

  tick: function(time, timeDelta) {
    if (!this.camera) return;
    
    // Check if in movement realm
    const isActive = this.checkIfMovementRealmActive();
    if (!isActive) {
      return;
    }
    
    const currentPosition = this.camera.object3D.position;
    const deltaTimeSec = timeDelta / 1000;
    
    this.timeSinceLastBlock += deltaTimeSec;
    
    const distance = this.lastPosition.distanceTo(currentPosition);
    
    // Create block when moved enough
    if (this.timeSinceLastBlock >= this.data.trailInterval && distance > 0.1) {
      this.createTrailBlock(currentPosition);
      this.timeSinceLastBlock = 0;
      this.lastPosition.copy(currentPosition);
    }
  },

  createTrailBlock: function(position) {
    this.blockCount++;
    console.log(`🔵 Creating block #${this.blockCount} at:`, position);
    
    const block = document.createElement('a-box');
    
    // Position on ground
    block.setAttribute('position', {
      x: position.x,
      y: this.data.heightOffset,
      z: position.z
    });
    
    block.setAttribute('width', this.data.blockSize);
    block.setAttribute('height', this.data.blockSize);
    block.setAttribute('depth', this.data.blockSize);
    
    // FIXED: Use only A-Frame compatible material properties
    block.setAttribute('material', {
      color: this.data.color,
      shader: 'flat',
      opacity: 0.85,
      transparent: true
    });
    
    // Slight random rotation for visual interest
    block.setAttribute('rotation', {
      x: Math.random() * 10 - 5,
      y: Math.random() * 360,
      z: Math.random() * 10 - 5
    });
    
    // Add to scene
    this.el.sceneEl.appendChild(block);
    this.trailBlocks.push(block);
    
    console.log(`✓ Block #${this.blockCount} added. Total blocks: ${this.trailBlocks.length}`);
    
    // Remove oldest if exceeding limit
    if (this.trailBlocks.length > this.data.maxBlocks) {
      const oldBlock = this.trailBlocks.shift();
      if (oldBlock.parentNode) {
        oldBlock.parentNode.removeChild(oldBlock);
      }
      console.log('Max blocks reached, removed oldest block');
    }
  },

  remove: function() {
    console.log('🔵 Removing permanent trail component');
    this.trailBlocks.forEach(block => {
      if (block.parentNode) {
        block.parentNode.removeChild(block);
      }
    });
    this.trailBlocks = [];
  }
});

console.log('✓✓✓ permanent-trail component loaded successfully! ✓✓✓');