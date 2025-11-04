/**
 * scene-manager.js - Manages scene states and transitions
 */

const SceneManager = {
  currentState: 'PATHWAY_SELECTION', // PATHWAY_SELECTION, IN_REALM, COLLECTING
  
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
        const pathwayId = e.target.id;
        this.handlePathwaySelection(pathwayId);
      });
      
      // Add hover effects
      pathway.addEventListener('mouseenter', (e) => {
        e.target.setAttribute('scale', '1.1 1.1 1.1');
      });
      
      pathway.addEventListener('mouseleave', (e) => {
        e.target.setAttribute('scale', '1 1 1');
      });
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
      VRScene.selectPathway(pathwayType);
    }
  },
  
  transitionToPathway: function(pathwayType) {
    console.log(`Transitioning to ${pathwayType} realm...`);
    
    // Hide pathway selection hub
    const hub = document.querySelector('#pathwayHub');
    hub.setAttribute('animation', {
      property: 'scale',
      to: '0 0 0',
      dur: 1000,
      easing: 'easeInOutQuad'
    });
    
    // Change environment based on pathway
    setTimeout(() => {
      this.setupPathwayEnvironment(pathwayType);
      this.currentState = 'IN_REALM';
      
      // Start spawning data fragments
      DataFragments.startSpawning(pathwayType);
    }, 1000);
  },
  
  setupPathwayEnvironment: function(pathwayType) {
    const scene = document.querySelector('a-scene');
    const sky = document.querySelector('a-sky');
    
    switch(pathwayType) {
      case 'TEXT':
        sky.setAttribute('color', '#330000'); // Dark red
        this.addTextEnvironment();
        break;
      case 'AUDIO':
        sky.setAttribute('color', '#003300'); // Dark green
        this.addAudioEnvironment();
        break;
      case 'MOVEMENT':
        sky.setAttribute('color', '#000033'); // Dark blue
        this.addMovementEnvironment();
        break;
    }
  },
  
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
    
    // Clear environment
    const container = document.querySelector('#dataFragmentsContainer');
    container.innerHTML = '';
    
    // Show pathway hub again
    const hub = document.querySelector('#pathwayHub');
    hub.setAttribute('scale', '1 1 1');
    
    // Reset sky
    const sky = document.querySelector('a-sky');
    sky.setAttribute('color', '#000033');
  }
};