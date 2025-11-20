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
    currentScene: {type: 'string', default: 'intro'}
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
      
      // Update SceneManager state
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