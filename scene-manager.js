/**
 * scene-manager.js - Manages scene states and transitions
 */

// ============================================
// A-FRAME COMPONENTS (Add these at the top)
// ============================================
console.log('=== scene-manager.js FILE LOADED ===');
/**
 * Scene Manager Component - handles switching between different environments
 */
AFRAME.registerComponent('scene-manager', {
  schema: {
    scenes: {type: 'array', default: ['intro', 'text', 'audio', 'movement']},
    currentScene: {type: 'string', default: 'intro'}
  },
  
  init: function() {
    console.log('>>> INIT FUNCTION CALLED <<<');  // Add this line
    console.log('Scene element:', this.el);         // Add this line
    console.log('Schema data:', this.data);         // Add this line
    this.scenes = {};
    const data = this.data;
    
    // Store references to all scene containers
    data.scenes.forEach(sceneName => {
      const sceneEl = document.querySelector(`#${sceneName}-scene`);
      if (sceneEl) {
        this.scenes[sceneName] = sceneEl;
        // Hide all scenes except current
        sceneEl.setAttribute('visible', sceneName === data.currentScene);
      }
    });
    
    console.log('Scene Manager Component initialized with scenes:', Object.keys(this.scenes));
  },
  
  switchScene: function(sceneName) {
    console.log('Switching to scene:', sceneName);
    
    // Hide all scenes
    Object.keys(this.scenes).forEach(name => {
      this.scenes[name].setAttribute('visible', false);
    });
    
    // Show target scene
    if (this.scenes[sceneName]) {
      this.scenes[sceneName].setAttribute('visible', true);
      this.data.currentScene = sceneName;
      
      // Emit event for other systems to react
      this.el.emit('sceneChanged', {newScene: sceneName});
      
      // Update your existing SceneManager state
      if (sceneName === 'intro') {
        SceneManager.currentState = 'PATHWAY_SELECTION';
      } else {
        SceneManager.currentState = 'IN_REALM';
        SceneManager.currentPathway = sceneName.toUpperCase();
      }
    } else {
      console.warn('Scene not found:', sceneName);
    }
  }
});
console.log('scene-manager component registered');

/**
 * Portal Button Component - makes entities clickable to switch scenes
 */
AFRAME.registerComponent('portal-button', {
  schema: {
    target: {type: 'string', default: 'text'},
    fadeTransition: {type: 'boolean', default: false},
    fadeDuration: {type: 'number', default: 500}
  },
  
  init: function() {
    const data = this.data;
    
    // Add cursor interaction
    this.el.classList.add('clickable');
    
    // Handle click
    this.onClick = () => {
      const sceneManager = document.querySelector('[scene-manager]');
      
      if (sceneManager && sceneManager.components['scene-manager']) {
        sceneManager.components['scene-manager'].switchScene(data.target);
      } else {
        console.warn('Scene manager not found');
      }
    };
    
    this.el.addEventListener('click', this.onClick);
    
    // Add hover effect
    this.onMouseEnter = () => {
      this.el.setAttribute('scale', '1.1 1.1 1.1');
    };
    
    this.onMouseLeave = () => {
      this.el.setAttribute('scale', '1 1 1');
    };
    
    this.el.addEventListener('mouseenter', this.onMouseEnter);
    this.el.addEventListener('mouseleave', this.onMouseLeave);
  },
  
  remove: function() {
    this.el.removeEventListener('click', this.onClick);
    this.el.removeEventListener('mouseenter', this.onMouseEnter);
    this.el.removeEventListener('mouseleave', this.onMouseLeave);
  }
});
console.log('portal-button component registered');

/**
 * Grid Floor Component - creates cyberpunk grid aesthetic
 */
AFRAME.registerComponent('grid-floor', {
  schema: {
    size: {default: 100},
    divisions: {default: 50},
    colorCenterLine: {default: '#ff0000'},
    colorGrid: {default: '#ff0000'}
  },
  
  init: function() {
    const data = this.data;
    const grid = new THREE.GridHelper(
      data.size, 
      data.divisions, 
      data.colorCenterLine, 
      data.colorGrid
    );
    grid.rotation.x = Math.PI / 2; // Rotate to be horizontal floor
    this.el.setObject3D('grid', grid);
  },
  
  remove: function() {
    this.el.removeObject3D('grid');
  }
});

console.log('grid-floor component registered');

// At the very end of scene-manager.js, add:
setTimeout(() => {
  console.log('=== CHECKING SCENE STRUCTURE ===');
  console.log('intro-scene:', document.querySelector('#intro-scene'));
  console.log('text-scene:', document.querySelector('#text-scene'));
  console.log('audio-scene:', document.querySelector('#audio-scene'));
  console.log('movement-scene:', document.querySelector('#movement-scene'));
  console.log('Scene with scene-manager attr:', document.querySelector('[scene-manager]'));
}, 3000);



// ============================================
// YOUR EXISTING SCENEMANAGER OBJECT (Modified)
// ============================================

const SceneManager = {
  currentState: 'PATHWAY_SELECTION', // PATHWAY_SELECTION, IN_REALM, COLLECTING
  currentPathway: null, // Store which pathway user is in
  
  init: function() {
    console.log('SceneManager initialized');
    this.setupEventListeners();
  },
  
  setupEventListeners: function() {
    // Get pathway elements
    const pathways = document.querySelectorAll('.pathway');
    pathways.forEach(pathway => {
      // Click/gaze interaction for pathway selection
      pathway.addEventListener('click', (e) => {
        const pathwayId = pathway.id; // Use pathway.id instead of e.target.id
        this.handlePathwaySelection(pathwayId);
      });
      
      // Note: Hover effects are now handled by portal-button component
      // But we can keep these if you want additional effects
      pathway.addEventListener('mouseenter', (e) => {
        // Additional hover effect if desired
      });
      pathway.addEventListener('mouseleave', (e) => {
        // Additional hover effect if desired
      });
    });
    
    // Listen for scene changes
    const sceneEl = document.querySelector('a-scene');
    sceneEl.addEventListener('sceneChanged', (e) => {
      console.log('Scene changed to:', e.detail.newScene);
      this.onSceneChanged(e.detail.newScene);
    });
  },
  
  handlePathwaySelection: function(pathwayId) {
    let pathwayType = null;
    
    switch(pathwayId) {
      case 'pathwayText':
        pathwayType = 'TEXT';
        break;
      case 'pathwayAudio':
        pathwayType = 'AUDIO';
        break;
      case 'pathwayMovement':
        pathwayType = 'MOVEMENT';
        break;
    }
    
    if (pathwayType) {
      console.log(`Selected ${pathwayType} pathway`);
      // The portal-button component will handle the actual scene switch
      // But we can do any additional setup here
    }
  },
  
  onSceneChanged: function(newScene) {
    // Called when scene actually changes
    if (newScene === 'intro') {
      this.currentState = 'PATHWAY_SELECTION';
      this.currentPathway = null;
    } else {
      this.currentState = 'IN_REALM';
      this.currentPathway = newScene.toUpperCase();
      
      // Start spawning data fragments when entering a realm
      if (typeof DataFragments !== 'undefined') {
        DataFragments.startSpawning(this.currentPathway);
      }
    }
  },
  
  // You can keep these methods for additional environment setup if needed
  addTextEnvironment: function() {
    console.log('Setting up TEXT environment');
    // Add floating text elements in the distance
    const container = document.querySelector('#dataFragmentsContainer');
    for (let i = 0; i < 10; i++) {
      const textElement = document.createElement('a-text');
      textElement.setAttribute('value', 'DATA');
      textElement.setAttribute('color', '#FF0000');
      textElement.setAttribute('position', {
        x: Math.random() * 20 - 10,
        y: Math.random() * 10,
        z: Math.random() * -20 - 10
      });
      textElement.setAttribute('scale', '3 3 3');
      textElement.setAttribute('opacity', '0.3');
      container.appendChild(textElement);
    }
  },
  
  addAudioEnvironment: function() {
    console.log('Setting up AUDIO environment');
    // Add pulsing audio visualizers
    const container = document.querySelector('#dataFragmentsContainer');
    for (let i = 0; i < 15; i++) {
      const audioViz = document.createElement('a-sphere');
      audioViz.setAttribute('radius', '0.5');
      audioViz.setAttribute('color', '#00FF00');
      audioViz.setAttribute('position', {
        x: Math.random() * 20 - 10,
        y: Math.random() * 10,
        z: Math.random() * -20 - 10
      });
      audioViz.setAttribute('opacity', '0.5');
      audioViz.setAttribute('animation', {
        property: 'scale',
        to: '1.5 1.5 1.5',
        dir: 'alternate',
        loop: true,
        dur: 1000 + Math.random() * 1000
      });
      container.appendChild(audioViz);
    }
  },
  
  addMovementEnvironment: function() {
    console.log('Setting up MOVEMENT environment');
    // Add particle trails
    const container = document.querySelector('#dataFragmentsContainer');
    for (let i = 0; i < 20; i++) {
      const trail = document.createElement('a-box');
      trail.setAttribute('width', '0.1');
      trail.setAttribute('height', '2');
      trail.setAttribute('depth', '0.1');
      trail.setAttribute('color', '#0000FF');
      trail.setAttribute('position', {
        x: Math.random() * 20 - 10,
        y: Math.random() * 10,
        z: Math.random() * -20 - 10
      });
      trail.setAttribute('opacity', '0.4');
      container.appendChild(trail);
    }
  },
  
  reset: function() {
    console.log('Resetting scene...');
    this.currentState = 'PATHWAY_SELECTION';
    this.currentPathway = null;
    
    // Clear environment
    const container = document.querySelector('#dataFragmentsContainer');
    if (container) {
      container.innerHTML = '';
    }
    
    // Switch back to intro scene
    const sceneManager = document.querySelector('[scene-manager]');
    if (sceneManager && sceneManager.components['scene-manager']) {
      sceneManager.components['scene-manager'].switchScene('intro');
    }
  }
};

// Initialize when A-Frame scene is loaded
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (scene.hasLoaded) {
    SceneManager.init();
  } else {
    scene.addEventListener('loaded', () => {
      SceneManager.init();
    });
  }
});