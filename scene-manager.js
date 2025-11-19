/**
 * scene-manager.js - Manages scene states and transitions
 */

console.log('=== scene-manager.js FILE LOADED ===');

// ============================================
// A-FRAME COMPONENTS
// ============================================

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
    console.log('>>> PORTAL BUTTON INIT <<<', this.el.id, 'target:', this.data.target); // DEBUG
    const data = this.data;
    
    // Add cursor interaction
    this.el.classList.add('clickable');
    
    // Handle click
    this.onClick = () => {
      console.log('>>> PORTAL CLICKED <<<', data.target); // DEBUG
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
      console.log('>>> PORTAL HOVER <<<', this.el.id); // DEBUG
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

    this.el.setObject3D('grid', grid);
  },
  
  remove: function() {
    this.el.removeObject3D('grid');
  }
});
console.log('grid-floor component registered');


/**
 * VR Keyboard Component - Creates an on-screen keyboard for text input
 */
AFRAME.registerComponent('vr-keyboard', {
  schema: {
    target: {type: 'string'},
    questionId: {type: 'string'},
    questionText: {type: 'string'}
  },
  
  init: function() {
    this.inputText = '';
    this.keyboard = null;
    this.createKeyboard();
  },
  
  createKeyboard: function() {
    const container = document.createElement('a-entity');
    container.setAttribute('position', '0 1.8 -2');
    container.setAttribute('visible', 'false');
    this.keyboard = container;
    
    // Dark background panel
    const panel = document.createElement('a-plane');
    panel.setAttribute('width', '6');
    panel.setAttribute('height', '4');
    panel.setAttribute('color', '#000000');
    panel.setAttribute('opacity', '0.9');
    container.appendChild(panel);
    
    // Glow border
    const border = document.createElement('a-plane');
    border.setAttribute('width', '6.2');
    border.setAttribute('height', '4.2');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.4');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    container.appendChild(border);
    
    // Title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'TYPE YOUR RESPONSE');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 1.6 0.01');
    title.setAttribute('color', '#ff0000');
    title.setAttribute('width', '4');
    container.appendChild(title);
    
    // Display area for typed text
    const display = document.createElement('a-plane');
    display.setAttribute('width', '5.5');
    display.setAttribute('height', '0.6');
    display.setAttribute('position', '0 1.1 0.01');
    display.setAttribute('color', '#1a1a1a');
    container.appendChild(display);
    
    const displayText = document.createElement('a-text');
    displayText.setAttribute('id', 'keyboard-display');
    displayText.setAttribute('value', '');
    displayText.setAttribute('align', 'center');
    displayText.setAttribute('position', '0 1.1 0.02');
    displayText.setAttribute('color', '#ffffff');
    displayText.setAttribute('width', '5');
    displayText.setAttribute('wrap-count', '35');
    container.appendChild(displayText);
    
    // Keyboard layout
    const keys = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
    
    let yPos = 0.5;
    keys.forEach((row, rowIndex) => {
      const xOffset = rowIndex * 0.25; // Stagger rows
      row.forEach((key, colIndex) => {
        const xPos = (colIndex - row.length / 2) * 0.5 + xOffset;
        this.createKey(key, xPos, yPos, container);
      });
      yPos -= 0.5;
    });
    
    // Space bar
    this.createKey('SPACE', 0, yPos - 0.2, container, 3, 0.4);
    
    // Backspace
    this.createKey('←', -2.5, 0.5, container, 0.8, 0.4);
    
    // Submit button
    const submitBtn = this.createKey('SUBMIT', 2, yPos - 0.2, container, 1.5, 0.5);
    submitBtn.setAttribute('class', 'clickable submit-key');
    
    // Close button
    const closeBtn = this.createKey('CLOSE', 2.5, 1.6, container, 0.8, 0.4);
    closeBtn.setAttribute('class', 'clickable close-key');
    
    document.querySelector('a-scene').appendChild(container);
  },
  
  createKey: function(label, x, y, parent, width = 0.4, height = 0.4) {
    const key = document.createElement('a-entity');
    key.setAttribute('position', `${x} ${y} 0.01`);
    key.setAttribute('class', 'clickable keyboard-key');
    key.setAttribute('data-key', label);
    
    const keyBg = document.createElement('a-box');
    keyBg.setAttribute('width', width);
    keyBg.setAttribute('height', height);
    keyBg.setAttribute('depth', '0.05');
    keyBg.setAttribute('color', '#ff0000');
    keyBg.setAttribute('opacity', '0.8');
    key.appendChild(keyBg);
    
    const keyText = document.createElement('a-text');
    keyText.setAttribute('value', label);
    keyText.setAttribute('align', 'center');
    keyText.setAttribute('position', `0 0 0.03`);
    keyText.setAttribute('color', '#000000');
    keyText.setAttribute('width', width * 2);
    key.appendChild(keyText);
    
    // Click handler
    key.addEventListener('click', () => {
      this.handleKeyPress(label);
    });
    
    parent.appendChild(key);
    return key;
  },
  
  handleKeyPress: function(key) {
    console.log('Key pressed:', key);
    const display = document.querySelector('#keyboard-display');
    
    if (key === 'SUBMIT') {
      if (this.inputText.trim()) {
        this.submitResponse();
      }
    } else if (key === 'CLOSE') {
      this.close();
    } else if (key === '←') {
      this.inputText = this.inputText.slice(0, -1);
      display.setAttribute('value', this.inputText);
    } else if (key === 'SPACE') {
      this.inputText += ' ';
      display.setAttribute('value', this.inputText);
    } else {
      this.inputText += key.toLowerCase();
      display.setAttribute('value', this.inputText);
    }
  },
  
  show: function() {
    this.inputText = '';
    document.querySelector('#keyboard-display').setAttribute('value', '');
    this.keyboard.setAttribute('visible', 'true');
  },
  
  close: function() {
    this.keyboard.setAttribute('visible', 'false');
    this.inputText = '';
  },
  
  submitResponse: function() {
    console.log('Submitting response:', this.inputText);
    
    // Find the responses container
    const container = document.querySelector(`#responses-${this.data.questionId}`);
    if (!container) {
      console.warn('Response container not found');
      return;
    }
    
    // Create sticky note
    this.createStickyNote(this.inputText, container);
    
    // Close keyboard
    this.close();
  },
  
  createStickyNote: function(text, container) {
    const note = document.createElement('a-entity');
    
    // Random position (scattered around the corner)
    const x = (Math.random() - 0.5) * 10;
    const y = Math.random() * 3 + 1;
    const z = Math.random() * 5 - 2;
    note.setAttribute('position', `${x} ${y} ${z}`);
    
    // Random rotation for organic placement
    const rotZ = (Math.random() - 0.5) * 15;
    note.setAttribute('rotation', `0 0 ${rotZ}`);
    
    // Main background panel (dark)
    const noteBg = document.createElement('a-plane');
    noteBg.setAttribute('width', '2.5');
    noteBg.setAttribute('height', '1.5');
    noteBg.setAttribute('color', '#000000');
    noteBg.setAttribute('opacity', '0.85');
    note.appendChild(noteBg);
    
    // Neon red border frame
    const border = document.createElement('a-plane');
    border.setAttribute('width', '2.55');
    border.setAttribute('height', '1.55');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.6');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    note.appendChild(border);
    
    // Corner accents (top-left)
    const cornerTL = document.createElement('a-box');
    cornerTL.setAttribute('width', '0.3');
    cornerTL.setAttribute('height', '0.05');
    cornerTL.setAttribute('depth', '0.01');
    cornerTL.setAttribute('position', '-1.1 0.7 0.01');
    cornerTL.setAttribute('color', '#ff0000');
    cornerTL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    note.appendChild(cornerTL);
    
    // Corner accents (top-right)
    const cornerTR = document.createElement('a-box');
    cornerTR.setAttribute('width', '0.3');
    cornerTR.setAttribute('height', '0.05');
    cornerTR.setAttribute('depth', '0.01');
    cornerTR.setAttribute('position', '1.1 0.7 0.01');
    cornerTR.setAttribute('color', '#ff0000');
    cornerTR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    note.appendChild(cornerTR);
    
    // Corner accents (bottom-left)
    const cornerBL = document.createElement('a-box');
    cornerBL.setAttribute('width', '0.3');
    cornerBL.setAttribute('height', '0.05');
    cornerBL.setAttribute('depth', '0.01');
    cornerBL.setAttribute('position', '-1.1 -0.7 0.01');
    cornerBL.setAttribute('color', '#ff0000');
    cornerBL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    note.appendChild(cornerBL);
    
    // Corner accents (bottom-right)
    const cornerBR = document.createElement('a-box');
    cornerBR.setAttribute('width', '0.3');
    cornerBR.setAttribute('height', '0.05');
    cornerBR.setAttribute('depth', '0.01');
    cornerBR.setAttribute('position', '1.1 -0.7 0.01');
    cornerBR.setAttribute('color', '#ff0000');
    cornerBR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    note.appendChild(cornerBR);
    
    // Vertical corner lines (left)
    const vertL = document.createElement('a-box');
    vertL.setAttribute('width', '0.05');
    vertL.setAttribute('height', '0.3');
    vertL.setAttribute('depth', '0.01');
    vertL.setAttribute('position', '-1.23 0.7 0.01');
    vertL.setAttribute('color', '#ff0000');
    vertL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    note.appendChild(vertL);
    
    // Vertical corner lines (right)
    const vertR = document.createElement('a-box');
    vertR.setAttribute('width', '0.05');
    vertR.setAttribute('height', '0.3');
    vertR.setAttribute('depth', '0.01');
    vertR.setAttribute('position', '1.23 -0.7 0.01');
    vertR.setAttribute('color', '#ff0000');
    vertR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    note.appendChild(vertR);
    
    // Diagonal accent lines (top)
    for (let i = 0; i < 3; i++) {
      const diag = document.createElement('a-box');
      diag.setAttribute('width', '0.15');
      diag.setAttribute('height', '0.03');
      diag.setAttribute('depth', '0.01');
      diag.setAttribute('position', `${0.3 + i * 0.15} 0.65 0.01`);
      diag.setAttribute('rotation', '0 0 -45');
      diag.setAttribute('color', '#ff0000');
      diag.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2.5');
      note.appendChild(diag);
    }
    
    // Diagonal accent lines (bottom)
    for (let i = 0; i < 3; i++) {
      const diag = document.createElement('a-box');
      diag.setAttribute('width', '0.15');
      diag.setAttribute('height', '0.03');
      diag.setAttribute('depth', '0.01');
      diag.setAttribute('position', `${-0.3 - i * 0.15} -0.65 0.01`);
      diag.setAttribute('rotation', '0 0 -45');
      diag.setAttribute('color', '#ff0000');
      diag.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2.5');
      note.appendChild(diag);
    }
    
    // Text on note (red cyberpunk style)
    const noteText = document.createElement('a-text');
    noteText.setAttribute('value', text);
    noteText.setAttribute('align', 'center');
    noteText.setAttribute('position', '0 0 0.02');
    noteText.setAttribute('color', '#ff0000');
    noteText.setAttribute('width', '2');
    noteText.setAttribute('wrap-count', '20');
    noteText.setAttribute('line-height', '45');
    note.appendChild(noteText);
    
    // Appear animation with glitch effect
    note.setAttribute('scale', '0 0 0');
    note.setAttribute('animation', {
      property: 'scale',
      to: '1 1 1',
      dur: 500,
      easing: 'easeOutBack'
    });
    
    // Optional: Subtle pulsing glow
    note.setAttribute('animation__pulse', {
      property: 'rotation',
      to: `0 0 ${rotZ + 2}`,
      dir: 'alternate',
      loop: true,
      dur: 3000,
      easing: 'easeInOutSine'
    });
    
    container.appendChild(note);
  }
});
console.log('vr-keyboard component registered');

console.log('vr-keyboard component registered');

/**
 * Question Responder Component - Opens VR keyboard when RESPOND button is clicked
 */
AFRAME.registerComponent('question-responder', {
  schema: {
    questionId: {type: 'string', default: 'question'},
    questionText: {type: 'string', default: 'Question?'}
  },
  
  init: function() {
    console.log('>>> QUESTION RESPONDER INIT <<<', this.data.questionId);
    const data = this.data;
    
    // Create keyboard instance for this question
    const keyboard = document.createElement('a-entity');
    keyboard.setAttribute('vr-keyboard', {
      questionId: data.questionId,
      questionText: data.questionText
    });
    document.querySelector('a-scene').appendChild(keyboard);
    
    // Wait for the vr-keyboard component to initialize
    keyboard.addEventListener('componentinitialized', (evt) => {
      if (evt.detail.name === 'vr-keyboard') {
        console.log('Keyboard component ready for', data.questionId);
        this.keyboardComponent = keyboard.components['vr-keyboard'];
      }
    });
    
    // Click handler
    this.el.addEventListener('click', () => {
      console.log('>>> RESPOND BUTTON CLICKED <<<', data.questionId);
      
      if (this.keyboardComponent) {
        console.log('Showing keyboard...');
        this.keyboardComponent.show();
      } else {
        console.warn('Keyboard component not ready yet!');
      }
    });
  }
});
console.log('question-responder component registered');


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