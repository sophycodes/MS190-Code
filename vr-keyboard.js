/**
 * vr-keyboard.js - Creates on-screen VR keyboard for text input
 * With Supabase storage for cross-device persistence
 */

console.log('=== vr-keyboard.js FILE LOADED ===');

const ResponseStorage = {
  async _fetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation'
    };
    
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        console.error('Supabase error:', await response.text());
        return null;
      }
      return response.json();
    } catch (e) {
      console.error('Network error:', e);
      return null;
    }
  },
  
  async getForQuestion(questionId) {
    const data = await this._fetch(`responses?question_id=eq.${questionId}&select=*`);
    return data || [];
  },
  
  // Track card count per question for grid positioning
  cardCounts: {},
  
  // 3D Grid layout - cards spread UP and BACK (behind question)
  gridConfig: {
    columns: 3,           // Cards per row (X axis)
    colSpacing: 3.0,      // Horizontal spacing
    rows: 4,              // Rows per depth layer (Y axis)
    rowSpacing: 2.2,      // Vertical spacing
    startY: 1,            // Bottom row Y position
    depthLayers: 5,       // How many layers deep
    depthSpacing: 4.0,    // Z spacing between layers
    startZ: -16,           // First layer Z (negative = behind question)
    jitterX: 0.3,         // Small random offset for organic feel
    jitterY: 0.2,
    jitterZ: 0.4
  },
  
  // Calculate grid position for a card (no overlaps!)
  getGridPosition(questionId) {
    if (!this.cardCounts[questionId]) {
      this.cardCounts[questionId] = 0;
    }
    const index = this.cardCounts[questionId];
    this.cardCounts[questionId]++;
    
    const config = this.gridConfig;
    
    // Cards per depth layer
    const cardsPerLayer = config.columns * config.rows;
    
    // Which depth layer (z)
    const depthLayer = Math.floor(index / cardsPerLayer);
    
    // Position within that layer
    const indexInLayer = index % cardsPerLayer;
    const col = indexInLayer % config.columns;
    const row = Math.floor(indexInLayer / config.columns);
    
    // Calculate base positions
    const baseX = (col - (config.columns - 1) / 2) * config.colSpacing;
    const baseY = config.startY + (row * config.rowSpacing);
    const baseZ = config.startZ - (depthLayer * config.depthSpacing);  // Goes BACK
    
    // Add jitter for organic feel
    const position = {
      x: baseX + (Math.random() - 0.5) * config.jitterX,
      y: baseY + (Math.random() - 0.5) * config.jitterY,
      z: baseZ + (Math.random() - 0.5) * config.jitterZ
    };
    
    // Slight tilt only, Y stays 0 to face forward
    const rotation = {
      x: (Math.random() - 0.5) * 8,
      y: 0,
      z: (Math.random() - 0.5) * 10
    };
    
    return { position, rotation };
  },
  
  async save(questionId, text) {
    // Get grid position (no overlaps!)
    const { position, rotation } = this.getGridPosition(questionId);
    
    const result = await this._fetch('responses', {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        text: text,
        position: position,
        rotation: rotation
      })
    });
    
    if (result && result.length > 0) {
      console.log(`Saved to Supabase:`, result[0]);
      return result[0];
    }
    return null;
  }
};

window.ResponseStorage = ResponseStorage;
// ============================================
// END OF SUPABASE ADDITION
// ============================================


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
    
    // Load saved responses from Supabase on init
    setTimeout(() => {
      this.loadSavedResponses();
    }, 1000);
  },
  
  // NEW: Load responses from Supabase
  async loadSavedResponses() {
    const questionId = this.data.questionId;
    console.log(`Loading responses from Supabase for ${questionId}...`);
    
    const responses = await ResponseStorage.getForQuestion(questionId);
    
    if (responses.length > 0) {
      console.log(`Found ${responses.length} saved responses for ${questionId}`);
      
      // Initialize card count so new cards continue from where we left off
      ResponseStorage.cardCounts[questionId] = responses.length;
      
      const container = document.querySelector(`#responses-${questionId}`);
      if (container) {
        responses.forEach((response, index) => {
          setTimeout(() => {
            // Use saved position/rotation from database
            this.createStickyNote(response.text, container, response.position, response.rotation);
          }, index * 150);
        });
      }
    } else {
      console.log(`No saved responses for ${questionId}`);
      ResponseStorage.cardCounts[questionId] = 0;
    }
  },
  
  createKeyboard: function() {
    const container = document.createElement('a-entity');
    container.setAttribute('position', '0 1.8 -2');
    container.setAttribute('visible', 'false');
    this.keyboard = container;
    
    // Dark background panel
    const panel = document.createElement('a-plane');
    panel.setAttribute('width', '7');  // Wider to fit spaced keys
    panel.setAttribute('height', '4.5');
    panel.setAttribute('color', '#000000');
    panel.setAttribute('opacity', '0.9');
    container.appendChild(panel);
    
    // Glow border
    const border = document.createElement('a-plane');
    border.setAttribute('width', '7.2');
    border.setAttribute('height', '4.7');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.4');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    container.appendChild(border);
    
    // Title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'TYPE YOUR RESPONSE');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 1.8 0.01');
    title.setAttribute('color', '#ff0000');
    title.setAttribute('width', '4');
    container.appendChild(title);
    
    // Display area for typed text
    const display = document.createElement('a-plane');
    display.setAttribute('width', '6.5');
    display.setAttribute('height', '0.6');
    display.setAttribute('position', '0 1.2 0.01');
    display.setAttribute('color', '#1a1a1a');
    container.appendChild(display);
    
    const displayText = document.createElement('a-text');
    displayText.setAttribute('id', `keyboard-display-${this.data.questionId}`);
    displayText.setAttribute('value', '');
    displayText.setAttribute('align', 'center');
    displayText.setAttribute('position', '0 1.2 0.02');
    displayText.setAttribute('color', '#ffffff');
    displayText.setAttribute('width', '5');
    displayText.setAttribute('wrap-count', '35');
    container.appendChild(displayText);
    
    // ============================================
    // KEYBOARD LAYOUT CONFIG - EASY TO ADJUST
    // ============================================
    const keyConfig = {
      keyWidth: 0.5,       // Width of each key
      keyHeight: 0.5,      // Height of each key
      keyGap: 0.12,        // Gap between keys
      rowGap: 0.15,        // Extra gap between rows
      startY: 0.5          // Starting Y position for first row
    };
    
    // Keyboard layout
    const keys = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
    
    let yPos = keyConfig.startY;
    const keyStep = keyConfig.keyWidth + keyConfig.keyGap;
    
    keys.forEach((row, rowIndex) => {
      // Calculate row offset for staggered layout
      const rowOffset = rowIndex * 0.25;
      
      // Calculate starting X to center the row
      const rowWidth = row.length * keyStep - keyConfig.keyGap;
      const startX = -rowWidth / 2 + keyConfig.keyWidth / 2 + rowOffset;
      
      row.forEach((key, colIndex) => {
        const xPos = startX + colIndex * keyStep;
        this.createKey(key, xPos, yPos, container, keyConfig.keyWidth, keyConfig.keyHeight);
      });
      
      yPos -= (keyConfig.keyHeight + keyConfig.rowGap);
    });
    
    // Space bar - positioned below last row
    const spaceY = yPos - 0.1;
    this.createKey('SPACE', 0, spaceY, container, 3, 0.5, 2.5);  // Last param is text width
    
    // Backspace - bottom left
    this.createKey('<-', -2.8, spaceY, container, 0.8, 0.5);
    
    // Submit button - bottom right
    this.createKey('SUBMIT', 2.8, spaceY, container, 1.0, 0.5);
    
    // Close button - top right corner
    this.createKey('X', 3, 1.8, container, 0.4, 0.4);
    
    document.querySelector('a-scene').appendChild(container);
  },
  
  createKey: function(label, x, y, parent, width = 0.5, height = 0.5, textWidth = null) {
    const key = document.createElement('a-entity');
    key.setAttribute('position', `${x} ${y} 0.01`);
    key.setAttribute('data-key', label);
    
    const keyBg = document.createElement('a-box');
    keyBg.setAttribute('width', width);
    keyBg.setAttribute('height', height);
    keyBg.setAttribute('depth', '0.05');
    keyBg.setAttribute('color', '#ff0000');
    keyBg.setAttribute('opacity', '1.0');
    keyBg.setAttribute('class', 'clickable keyboard-key');
    key.appendChild(keyBg);
    
    const keyText = document.createElement('a-text');
    keyText.setAttribute('value', label);
    keyText.setAttribute('align', 'center');
    keyText.setAttribute('position', `0 0 0.03`);
    keyText.setAttribute('color', '#ffffff');
    // Use custom text width if provided, otherwise scale to key width
    keyText.setAttribute('width', textWidth !== null ? textWidth : width * 6);
    key.appendChild(keyText);
    
    // Click handler - attach to the BOX, not the parent entity
    keyBg.addEventListener('click', (event) => {
      event.stopPropagation();
      console.log('>>> KEY CLICKED <<<', label);
      this.handleKeyPress(label);
    });
    
    parent.appendChild(key);
    return key;
  },
  
  handleKeyPress: function(key) {

    // Only respond if keyboard is visible
    if (!this.keyboard || this.keyboard.getAttribute('visible') === false) {
      console.log('Keyboard hidden, ignoring key press');
      return;
    }
  
  console.log('Key pressed:', key);
    console.log('Key pressed:', key);

    const display = document.querySelector(`#keyboard-display-${this.data.questionId}`);

    
    if (key === 'SUBMIT') {
      if (this.inputText.trim()) {
        this.submitResponse();
      }
    } else if (key === 'X') {
      this.close();
    } else if (key === '<-') {
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
    document.querySelector(`#keyboard-display-${this.data.questionId}`).setAttribute('value', '');
    
    // Get the world position of the RESPOND button
    const worldPos = buttonEntity.object3D.getWorldPosition(new THREE.Vector3());
    
    // Get the world rotation of the parent corner
    const parentCorner = buttonEntity.parentElement;
    const cornerRotation = parentCorner ? parentCorner.getAttribute('rotation') : {x: 0, y: 0, z: 0};
    const yRot = cornerRotation ? cornerRotation.y : 0;
    
    // Adjust position based on which question/corner
    let xOffset = 0;
    let zOffset = 1.5;
    
    const questionId = this.data.questionId;
    
    switch(questionId) {
      case 'fear':
        // Corner 1: TECHNOLOGICAL FEAR
        xOffset = 1.85;
        zOffset = 2;
        break;
      case 'data':
        // Corner 2: Front-Right (rotation -45)
        xOffset = -1.85;
        zOffset = 2;
        break;
      case 'disassociate':
        // Corner 3: DISASSOCIATION (rotation 135)
        xOffset = 1.85;
        zOffset = -2;
        break;
      default:
        xOffset = 0;
        zOffset = 1.5;
    }
    
    // Position keyboard below the question, with corner-specific offset
    this.keyboard.setAttribute('position', `${worldPos.x + xOffset} ${worldPos.y - 0.5} ${worldPos.z + zOffset}`);
    this.keyboard.setAttribute('rotation', `-30 ${yRot} 0`);
    this.keyboard.setAttribute('visible', 'true');

    // Re-add clickable class to keys
    const keys = this.keyboard.querySelectorAll('.keyboard-key');
    keys.forEach(key => {
      key.classList.add('clickable');
    });
  },
    
  close: function() {
    console.log('>>> CLOSE KEYBOARD <<<', this.data.questionId);
    this.keyboard.setAttribute('visible', 'false');
    
    // Remove clickable class from all keys to prevent raycaster hits
    const keys = this.keyboard.querySelectorAll('.keyboard-key');
    keys.forEach(key => {
      key.classList.remove('clickable');
    });
    
    // Move keyboard far away
    this.keyboard.setAttribute('position', '0 -1000 0');
    this.inputText = '';
  },
  
  // MODIFIED: Now saves to Supabase with grid positioning
  async submitResponse() {
    console.log('Submitting response:', this.inputText);
    
    // Find the responses container
    const container = document.querySelector(`#responses-${this.data.questionId}`);
    if (!container) {
      console.warn('Response container not found');
      return;
    }
    
    // Save to Supabase (grid position calculated automatically)
    const savedResponse = await ResponseStorage.save(this.data.questionId, this.inputText);
    
    if (savedResponse) {
      // Create sticky note with the saved position
      this.createStickyNote(savedResponse.text, container, savedResponse.position, savedResponse.rotation);
    } else {
      console.error('Failed to save to Supabase');
    }
    
    // Close keyboard
    this.close();
  },
  
  // Creates response card at grid position (behind question panel)
  createStickyNote: function(text, container, position, rotation) {
    const note = document.createElement('a-entity');
    
    // Use grid position (z is negative = behind question)
    note.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
    note.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
    
    console.log(`Creating card at z=${position.z} (behind question panel)`);
    
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
      diag.setAttribute('position', `${0.3 + i * 0.15}
         0.65 0.01`);
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
    
    // Appear animation
    note.setAttribute('scale', '0 0 0');
    note.setAttribute('animation', {
      property: 'scale',
      to: '1 1 1',
      dur: 500,
      easing: 'easeOutBack'
    });
    
    // Subtle floating animation
    note.setAttribute('animation__float', {
      property: 'position',
      to: `${position.x} ${position.y + 0.15} ${position.z}`,
      dir: 'alternate',
      loop: true,
      dur: 3000 + Math.random() * 2000,
      easing: 'easeInOutSine'
    });
    
    container.appendChild(note);
  }
});

console.log('vr-keyboard component registered');