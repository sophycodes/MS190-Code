/**
 * scene-manager.js - Manages scene states and transitions
 */

console.log('=== scene-manager.js FILE LOADED ===');

/**
 * Scene Manager Component - handles switching between different environments
 */
AFRAME.registerComponent('scene-manager', {
  schema: {
    scenes: {type: 'array', default: ['intro', 'text', 'audio', 'movement']},
    currentScene: {type: 'string', default: 'intro'},
    startPosition: {type: 'vec3', default: {x: 0, y: -0.4, z: 4.5}}
  },
  
  init: function() {
    console.log('>>> SCENE MANAGER INIT <<<');
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
    
    console.log('Scene Manager initialized with scenes:', Object.keys(this.scenes));
  },
  
  switchScene: function(sceneName) {
    console.log('Switching to scene:', sceneName);
    
    // Mute music in Audio Realm, unmute in others
    const bgMusic = document.querySelector('#background-music');
    if (bgMusic) {
      bgMusic.setAttribute('sound', 'volume', sceneName === 'audio' ? 0 : 0.3);
    }

    // Hide all scenes AND disable raycasting
    Object.keys(this.scenes).forEach(name => {
      const scene = this.scenes[name];
      scene.setAttribute('visible', false);
      
      // Disable raycasting for all clickable elements in hidden scenes
      const clickables = scene.querySelectorAll('.clickable');
      clickables.forEach(el => {
        if (el.classList) {
          el.classList.remove('clickable');
          el.setAttribute('data-was-clickable', 'true'); // Remember it was clickable
        }
      });
    });
    
    // Show target scene AND re-enable raycasting
    if (this.scenes[sceneName]) {
      const targetScene = this.scenes[sceneName];
      targetScene.setAttribute('visible', true);
      
      // Re-enable raycasting for clickable elements in the active scene
      const clickables = targetScene.querySelectorAll('[data-was-clickable]');
      clickables.forEach(el => {
        el.classList.add('clickable');
        el.removeAttribute('data-was-clickable');
      });
      
      this.data.currentScene = sceneName;
      
      if (sceneName === 'intro') {
        window.location.reload();
        return;
      }
      
      // Emit event
      this.el.emit('sceneChanged', {newScene: sceneName});
      
      // Update SceneManager state
      if (sceneName === 'intro') {
        SceneManager.currentState = 'PATHWAY_SELECTION';
      } else {
        SceneManager.currentState = 'IN_REALM';
        SceneManager.currentPathway = sceneName.toUpperCase();
      }
    }
  },
  
  resetPlayerPosition: function() {
      const player = document.querySelector('#player');
      const camera = document.querySelector('a-camera');
      
      if (player) {
        // Remove any existing animation
        player.removeAttribute('animation');
        
        // Reset player position
        player.object3D.position.set(0.0, -0.4, 4.5);
        player.object3D.rotation.set(0, 0, 0);
        player.setAttribute('position', '0.0 -0.4 4.5');
        player.setAttribute('rotation', '0 0 0');
      }
      
      if (camera && camera.components['look-controls']) {
        // Properly reset look-controls by removing and re-adding
        camera.removeAttribute('look-controls');
        
        // Small delay then re-add look-controls
        setTimeout(() => {
          camera.setAttribute('look-controls', '');
          console.log('Camera and look-controls fully reset');
        }, 100);
      }
      
      console.log('Player position and rotation reset to start');
    }
});

console.log('scene-manager component registered');

// ============================================
// SCENEMANAGER OBJECT
// ============================================

const SceneManager = {
  currentState: 'PATHWAY_SELECTION',
  currentPathway: null,
  
  init: function() {
    console.log('SceneManager object initialized');
    this.setupEventListeners();
  },
  
  setupEventListeners: function() {
    // Listen for scene changes
    const sceneEl = document.querySelector('a-scene');
    sceneEl.addEventListener('sceneChanged', (e) => {
      console.log('Scene changed to:', e.detail.newScene);
      this.onSceneChanged(e.detail.newScene);
    });
  },
  
  onSceneChanged: function(newScene) {
    if (newScene === 'intro') {
      this.currentState = 'PATHWAY_SELECTION';
      this.currentPathway = null;
    } else {
      this.currentState = 'IN_REALM';
      this.currentPathway = newScene.toUpperCase();
    }
  },
  
  reset: function() {
    console.log('Resetting scene...');
    this.currentState = 'PATHWAY_SELECTION';
    this.currentPathway = null;
    
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