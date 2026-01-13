/**
 * vr-scene.js - Main VR Scene Controller
 * Initializes and coordinates all scene components
 */

// Global scene state
const VRScene = {
  initialized: false,
  selectedPathway: null,
  dataCollected: 0,
  playerTransformation: 0, // 0-100, tracks how distorted the player becomes
  
  init: function() {
    console.log('Initializing VR Scene...');
    
    // Wait for A-Frame scene to load
    const scene = document.querySelector('a-scene');
    
    if (scene.hasLoaded) {
      this.setup();
    } else {
      scene.addEventListener('loaded', () => {
        this.setup();
      });
    }
  },
  
  setup: function() {
    console.log('Scene loaded, setting up components...');
    
    // Initialize components
    SceneManager.init();
    Player.init();
    Pathways.init();
    // DataFragments.init();
    
    this.initialized = true;
    console.log('VR Scene ready!');
  },
  
  selectPathway: function(pathwayType) {
    console.log(`Pathway selected: ${pathwayType}`);
    this.selectedPathway = pathwayType;
    
    // Trigger pathway transition
    SceneManager.transitionToPathway(pathwayType);
  },
  
  collectData: function(dataType, isPositive) {
    this.dataCollected++;
    
    // Update player transformation based on data collection
    if (isPositive) {
      Player.strengthen();
    } else {
      Player.weaken();
    }
    
    // Check if collecting too much data
    if (this.dataCollected > 20) {
      this.playerTransformation = Math.min(100, this.playerTransformation + 5);
      Player.distort(this.playerTransformation);
    }
    
    console.log(`Data collected: ${this.dataCollected}, Transformation: ${this.playerTransformation}%`);
  },
  
  reset: function() {
    this.selectedPathway = null;
    this.dataCollected = 0;
    this.playerTransformation = 0;
    
    DataFragments.reset();
    Player.reset();
    SceneManager.reset();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  VRScene.init();
});