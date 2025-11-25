/**
 * vr-keyboard.js - Creates on-screen VR keyboard for text input
 */

console.log('=== vr-keyboard.js FILE LOADED ===');

/**
 * VR Keyboard Component - Creates an on-screen keyboard for text input
 * Features: QWERTY layout, text display, submit/close buttons
 * Creates cyberpunk-styled response notes when submitted
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
    this.createKey('SPACE', 0, yPos - 0.2, container, 2, 0.4);
    
    // TO DO fix back space
    // TO DO how to save user responses when web refreshes
    // Backspace
    this.createKey('←', -2.5, 0.5, container, 0.8, 0.4);
    
    // Submit button
    this.createKey('SUBMIT', 2.5, yPos - 0.4, container, 0.8, 0.4);
    
    // Close button
    this.createKey('X', 2.5, 1.6, container, 0.4, 0.4);
    
    document.querySelector('a-scene').appendChild(container);
  },
  
  createKey: function(label, x, y, parent, width = 0.4, height = 0.4) {
    const key = document.createElement('a-entity');
    key.setAttribute('position', `${x} ${y} 0.01`);
    key.setAttribute('data-key', label);
    
    const keyBg = document.createElement('a-box');
    keyBg.setAttribute('width', width);
    keyBg.setAttribute('height', height);
    keyBg.setAttribute('depth', '0.05');
    keyBg.setAttribute('color', '#ff0000');
    keyBg.setAttribute('opacity', '1.0');
    keyBg.setAttribute('class', 'clickable keyboard-key'); // MOVED HERE!
    key.appendChild(keyBg);
    
    const keyText = document.createElement('a-text');
    keyText.setAttribute('value', label);
    keyText.setAttribute('align', 'center');
    keyText.setAttribute('position', `0 0 0.03`);
    keyText.setAttribute('color', '#ffffff');
    keyText.setAttribute('width', width * 5);
    key.appendChild(keyText);
    
    // Click handler - attach to the BOX, not the parent entity
    keyBg.addEventListener('click', () => {
      console.log('>>> KEY CLICKED <<<', label);
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
  
  show: function(buttonEntity) {
    this.inputText = '';
    document.querySelector('#keyboard-display').setAttribute('value', '');
    
    // Get the world position of the RESPOND button
    const worldPos = buttonEntity.object3D.getWorldPosition(new THREE.Vector3());
    
    // Position keyboard to the "right" of each corner
    let xOffset, zOffset, rotation;
    
    switch(this.data.questionId) {
      case 'fear':  // Front-Left corner (rotation: 0 45 0)
        xOffset = 8;
        zOffset = 2;
        rotation = '0 20 0';
        break;
        
      case 'data':  // Front-Right corner (rotation: 0 -45 0)
        xOffset = -8;
        zOffset = 2;
        rotation = '0 -20 0';
        break;
        
      case 'disassociate':  // Back-Left corner (rotation: 0 135 0)
        xOffset = -8;  // Left in world space = right relative to this rotated corner
        zOffset = 8;
        rotation = '0 110 0';  // Face toward the viewer
        break;
        
      default:
        xOffset = 8;
        zOffset = 0;
        rotation = '0 0 0';
    }
    
    this.keyboard.setAttribute('position', `${worldPos.x + xOffset} ${worldPos.y} ${worldPos.z + zOffset}`);
    this.keyboard.setAttribute('rotation', rotation);
    this.keyboard.setAttribute('visible', 'true');
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