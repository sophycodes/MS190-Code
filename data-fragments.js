/**
 * data-fragments.js - Manages collectible data fragments
 * Handles spawning, collection, and effects of positive/negative data
 */

const DataFragments = {
  fragments: [],
  spawnInterval: null,
  spawnRate: 3000, // milliseconds between spawns
  
  init: function() {
    console.log('DataFragments initialized');
    this.setupCollisionDetection();
  },
  
  startSpawning: function(pathwayType) {
    console.log(`Starting data fragment spawning for ${pathwayType} pathway`);
    
    // Initial spawn
    this.spawnFragments(pathwayType, 5);
    
    // Continuous spawning
    this.spawnInterval = setInterval(() => {
      this.spawnFragments(pathwayType, 2);
    }, this.spawnRate);
  },
  
  stopSpawning: function() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
  },
  
  spawnFragments: function(pathwayType, count) {
    for (let i = 0; i < count; i++) {
      // 70% chance for positive data, 30% for negative
      const isPositive = Math.random() > 0.3;
      
      if (isPositive) {
        this.createPositiveFragment(pathwayType);
      } else {
        this.createNegativeFragment(pathwayType);
      }
    }
  },
  
  createPositiveFragment: function(pathwayType) {
    const container = document.querySelector('#dataFragmentsContainer');
    const fragment = document.createElement('a-entity');
    
    const position = this.getRandomPosition();
    
    switch(pathwayType) {
      case 'TEXT':
        // Previous participant's text note
        const textNote = Pathways.textPathway.createNote(
          Pathways.textPathway.promptUserInput(),
          position
        );
        fragment.appendChild(textNote);
        break;
        
      case 'AUDIO':
        // Audio visualization from previous participant
        const audioViz = Pathways.audioPathway.createAudioVisualization(position);
        fragment.appendChild(audioViz);
        break;
        
      case 'MOVEMENT':
        // Movement trace
        const trace = document.createElement('a-sphere');
        trace.setAttribute('radius', '0.3');
        trace.setAttribute('color', '#0088FF');
        trace.setAttribute('opacity', '0.7');
        trace.setAttribute('animation', {
          property: 'position',
          to: `${position.x} ${position.y + 1} ${position.z}`,
          dir: 'alternate',
          loop: true,
          dur: 2000
        });
        fragment.appendChild(trace);
        break;
    }
    
    fragment.setAttribute('position', position);
    fragment.setAttribute('class', 'data-fragment positive');
    fragment.setAttribute('data-type', pathwayType);
    
    // Make it collectable
    this.makeCollectable(fragment, true);
    
    container.appendChild(fragment);
    this.fragments.push(fragment);
  },
  
  createNegativeFragment: function(pathwayType) {
    const container = document.querySelector('#dataFragmentsContainer');
    
    Pathways.generateCorruptedData(pathwayType);
    
    // Get the last added corrupted element
    const allFragments = container.querySelectorAll('.data-fragment.negative');
    const fragment = allFragments[allFragments.length - 1];
    
    if (fragment) {
      fragment.setAttribute('data-type', pathwayType);
      this.makeCollectable(fragment, false);
      this.fragments.push(fragment);
    }
  },
  
  makeCollectable: function(fragment, isPositive) {
    // Add collision detection
    fragment.setAttribute('id', `fragment-${this.fragments.length}`);
    
    // Visual feedback on proximity
    fragment.addEventListener('mouseenter', () => {
      fragment.setAttribute('scale', '1.2 1.2 1.2');
    });
    
    fragment.addEventListener('mouseleave', () => {
      fragment.setAttribute('scale', '1 1 1');
    });
    
    // Collection on click (or VR controller trigger)
    fragment.addEventListener('click', () => {
      this.collectFragment(fragment, isPositive);
    });
  },
  
  setupCollisionDetection: function() {
    // Check for hand proximity to fragments
    setInterval(() => {
      const leftHand = document.querySelector('#leftHand');
      const rightHand = document.querySelector('#rightHand');
      
      if (!leftHand || !rightHand) return;
      
      const leftPos = leftHand.object3D.position;
      const rightPos = rightHand.object3D.position;
      
      this.fragments.forEach(fragment => {
        if (!fragment.parentNode) return; // Already collected
        
        const fragPos = fragment.object3D.position;
        const distanceLeft = this.calculateDistance(leftPos, fragPos);
        const distanceRight = this.calculateDistance(rightPos, fragPos);
        
        // Auto-collect if hand is close enough (0.5 units)
        if (distanceLeft < 0.5 || distanceRight < 0.5) {
          const isPositive = fragment.classList.contains('positive');
          this.collectFragment(fragment, isPositive);
        }
      });
    }, 100); // Check every 100ms
  },
  
  collectFragment: function(fragment, isPositive) {
    if (!fragment.parentNode) return; // Already collected
    
    const dataType = fragment.getAttribute('data-type');
    
    // Visual collection effect
    fragment.setAttribute('animation', {
      property: 'scale',
      to: '0 0 0',
      dur: 300,
      easing: 'easeInQuad'
    });
    
    fragment.setAttribute('animation__move', {
      property: 'position',
      to: Player.getPosition(),
      dur: 300,
      easing: 'easeInQuad'
    });
    
    // Play collection sound (if audio system is set up)
    this.playCollectionSound(isPositive);
    
    // Remove after animation
    setTimeout(() => {
      if (fragment.parentNode) {
        fragment.parentNode.removeChild(fragment);
      }
      
      // Remove from tracking array
      const index = this.fragments.indexOf(fragment);
      if (index > -1) {
        this.fragments.splice(index, 1);
      }
    }, 300);
    
    // Update game state
    VRScene.collectData(dataType, isPositive);
    
    console.log(`Collected ${isPositive ? 'positive' : 'negative'} ${dataType} data`);
  },
  
  playCollectionSound: function(isPositive) {
    // Placeholder for sound effect
    // In real implementation, play audio using Web Audio API or A-Frame sound component
    console.log(`Playing ${isPositive ? 'positive' : 'negative'} collection sound`);
  },
  
  getRandomPosition: function() {
    return {
      x: Math.random() * 20 - 10,
      y: Math.random() * 5 + 1,
      z: Math.random() * -15 - 5
    };
  },
  
  calculateDistance: function(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  },
  
  reset: function() {
    console.log('Resetting data fragments...');
    
    this.stopSpawning();
    
    // Remove all fragments from scene
    const container = document.querySelector('#dataFragmentsContainer');
    container.innerHTML = '';
    
    this.fragments = [];
  }
};