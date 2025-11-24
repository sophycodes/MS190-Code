/**
 * vr-keyboard.js - VR Keyboard with Supabase Response Storage
 * 
 * Features:
 * - On-screen QWERTY keyboard for VR text input
 * - Response cards spawn BEHIND question panels (forest of cards)
 * - All responses saved to Supabase and sync across devices
 * - Cyberpunk neon frame aesthetic
 */

console.log('=== vr-keyboard.js FILE LOADED ===');

// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://lhbfbvdjpgrihsibymkw.supabase.co';      
const SUPABASE_ANON_KEY = 'sb_publishable_D0_3seHXUnPzf5jlgqy_Cg_946f5DRZ';     // e.g., 'eyJhbGciOiJIUzI1NiIs...'

// ============================================
// SUPABASE RESPONSE STORAGE
// ============================================
const ResponseStorage = {
  
  // Helper to make Supabase REST API calls
  async _fetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation'
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Supabase error:', error);
        return null;
      }
      
      return response.json();
    } catch (e) {
      console.error('Network error:', e);
      return null;
    }
  },
  
  // Get all responses (organized by question_id)
  async getAll() {
    const data = await this._fetch('responses?select=*');
    if (!data) return {};
    
    // Organize by question_id
    const organized = {};
    data.forEach(response => {
      if (!organized[response.question_id]) {
        organized[response.question_id] = [];
      }
      organized[response.question_id].push(response);
    });
    return organized;
  },
  
  // Get responses for a specific question
  async getForQuestion(questionId) {
    const data = await this._fetch(`responses?question_id=eq.${questionId}&select=*`);
    return data || [];
  },
  
  // Save a new response
  async save(questionId, text) {
    // Generate random position (behind the question panel)
    const position = {
      x: (Math.random() - 0.5) * 8,
      y: Math.random() * 4 + 1.5,
      z: -(Math.random() * 12 + 3)  // Negative Z = BEHIND the question
    };
    
    // Generate random rotation for organic feel
    const rotation = {
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 30,
      z: (Math.random() - 0.5) * 15
    };
    
    const responseData = {
      question_id: questionId,
      text: text,
      position: position,
      rotation: rotation
    };
    
    const result = await this._fetch('responses', {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
    
    if (result && result.length > 0) {
      console.log(`Saved response to Supabase for ${questionId}:`, result[0]);
      return result[0];
    }
    
    return null;
  },
  
  // Delete all responses (for testing - requires DELETE policy)
  async clearAll() {
    console.warn('clearAll requires a DELETE policy in Supabase');
  },
  
  // Delete responses for a specific question (requires DELETE policy)
  async clearQuestion(questionId) {
    console.warn('clearQuestion requires a DELETE policy in Supabase');
  }
};

// Make storage accessible globally for debugging
window.ResponseStorage = ResponseStorage;


// ============================================
// VR KEYBOARD COMPONENT
// ============================================
AFRAME.registerComponent('vr-keyboard', {
  schema: {
    target: {type: 'string'},
    questionId: {type: 'string'},
    questionText: {type: 'string'}
  },
  
  init: function() {
    console.log('>>> VR KEYBOARD INIT <<<', this.data.questionId);
    this.inputText = '';
    this.keyboard = null;
    this.createKeyboard();
    
    // Load existing responses from Supabase after a short delay
    setTimeout(() => {
      this.loadSavedResponses();
    }, 1000);
  },
  
  // Load and display all saved responses for this question
  async loadSavedResponses() {
    const questionId = this.data.questionId;
    
    console.log(`Loading responses from Supabase for ${questionId}...`);
    const responses = await ResponseStorage.getForQuestion(questionId);
    
    if (responses.length > 0) {
      console.log(`Found ${responses.length} saved responses for ${questionId}`);
      
      const container = document.querySelector(`#responses-${questionId}`);
      if (container) {
        responses.forEach((response, index) => {
          // Stagger the appearance for visual effect
          setTimeout(() => {
            this.createResponseCard(
              response.text, 
              container, 
              response.position, 
              response.rotation
            );
          }, index * 150);
        });
      }
    } else {
      console.log(`No saved responses for ${questionId}`);
    }
  },
  
  createKeyboard: function() {
    const container = document.createElement('a-entity');
    container.setAttribute('id', `keyboard-${this.data.questionId}`);
    container.setAttribute('position', '0 1.6 -1.5');
    container.setAttribute('visible', 'false');
    this.keyboard = container;
    
    // Dark background panel
    const panel = document.createElement('a-plane');
    panel.setAttribute('width', '5');
    panel.setAttribute('height', '3.5');
    panel.setAttribute('color', '#000000');
    panel.setAttribute('opacity', '0.95');
    container.appendChild(panel);
    
    // Neon red border glow
    const border = document.createElement('a-plane');
    border.setAttribute('width', '5.1');
    border.setAttribute('height', '3.6');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.5');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    container.appendChild(border);
    
    // Question text at top
    const questionLabel = document.createElement('a-text');
    questionLabel.setAttribute('value', this.data.questionText || 'Enter your response:');
    questionLabel.setAttribute('align', 'center');
    questionLabel.setAttribute('position', '0 1.45 0.01');
    questionLabel.setAttribute('color', '#ff0000');
    questionLabel.setAttribute('width', '4');
    questionLabel.setAttribute('wrap-count', '40');
    container.appendChild(questionLabel);
    
    // Text display area
    const displayBg = document.createElement('a-plane');
    displayBg.setAttribute('width', '4.5');
    displayBg.setAttribute('height', '0.5');
    displayBg.setAttribute('position', '0 1 0.01');
    displayBg.setAttribute('color', '#1a0000');
    container.appendChild(displayBg);
    
    const displayText = document.createElement('a-text');
    displayText.setAttribute('id', `display-${this.data.questionId}`);
    displayText.setAttribute('value', '_');
    displayText.setAttribute('align', 'center');
    displayText.setAttribute('position', '0 1 0.02');
    displayText.setAttribute('color', '#ff3333');
    displayText.setAttribute('width', '4');
    container.appendChild(displayText);
    this.displayText = displayText;
    
    // Create keyboard rows
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];
    
    const startY = 0.5;
    const keyWidth = 0.4;
    const keyHeight = 0.4;
    const keySpacing = 0.45;
    
    rows.forEach((row, rowIndex) => {
      const rowOffset = (rows[0].length - row.length) * keySpacing / 2;
      
      row.forEach((key, keyIndex) => {
        const keyEntity = document.createElement('a-entity');
        const x = (keyIndex - (row.length - 1) / 2) * keySpacing + rowOffset * 0.3;
        const y = startY - rowIndex * keySpacing;
        keyEntity.setAttribute('position', `${x} ${y} 0.02`);
        
        // Key background
        const keyBg = document.createElement('a-plane');
        keyBg.setAttribute('width', keyWidth);
        keyBg.setAttribute('height', keyHeight);
        keyBg.setAttribute('color', '#220000');
        keyBg.setAttribute('class', 'clickable');
        keyEntity.appendChild(keyBg);
        
        // Key border
        const keyBorder = document.createElement('a-plane');
        keyBorder.setAttribute('width', keyWidth + 0.02);
        keyBorder.setAttribute('height', keyHeight + 0.02);
        keyBorder.setAttribute('position', '0 0 -0.005');
        keyBorder.setAttribute('color', '#ff0000');
        keyBorder.setAttribute('opacity', '0.5');
        keyEntity.appendChild(keyBorder);
        
        // Key label
        const keyLabel = document.createElement('a-text');
        keyLabel.setAttribute('value', key);
        keyLabel.setAttribute('align', 'center');
        keyLabel.setAttribute('position', '0 0 0.01');
        keyLabel.setAttribute('color', '#ff0000');
        keyLabel.setAttribute('width', '2');
        keyEntity.appendChild(keyLabel);
        
        // Click handler
        keyBg.addEventListener('click', () => {
          if (key === '⌫') {
            this.inputText = this.inputText.slice(0, -1);
          } else {
            this.inputText += key;
          }
          this.updateDisplay();
        });
        
        container.appendChild(keyEntity);
      });
    });
    
    // Space bar
    const spaceBar = document.createElement('a-entity');
    spaceBar.setAttribute('position', '0 -0.85 0.02');
    
    const spaceBg = document.createElement('a-plane');
    spaceBg.setAttribute('width', '2.5');
    spaceBg.setAttribute('height', '0.35');
    spaceBg.setAttribute('color', '#220000');
    spaceBg.setAttribute('class', 'clickable');
    spaceBar.appendChild(spaceBg);
    
    const spaceBorder = document.createElement('a-plane');
    spaceBorder.setAttribute('width', '2.52');
    spaceBorder.setAttribute('height', '0.37');
    spaceBorder.setAttribute('position', '0 0 -0.005');
    spaceBorder.setAttribute('color', '#ff0000');
    spaceBorder.setAttribute('opacity', '0.5');
    spaceBar.appendChild(spaceBorder);
    
    const spaceLabel = document.createElement('a-text');
    spaceLabel.setAttribute('value', 'SPACE');
    spaceLabel.setAttribute('align', 'center');
    spaceLabel.setAttribute('position', '0 0 0.01');
    spaceLabel.setAttribute('color', '#ff0000');
    spaceLabel.setAttribute('width', '2');
    spaceBar.appendChild(spaceLabel);
    
    spaceBg.addEventListener('click', () => {
      this.inputText += ' ';
      this.updateDisplay();
    });
    
    container.appendChild(spaceBar);
    
    // Submit button
    const submitBtn = document.createElement('a-entity');
    submitBtn.setAttribute('position', '1.8 -1.35 0.02');
    
    const submitBg = document.createElement('a-plane');
    submitBg.setAttribute('width', '1.2');
    submitBg.setAttribute('height', '0.4');
    submitBg.setAttribute('color', '#ff0000');
    submitBg.setAttribute('class', 'clickable');
    submitBtn.appendChild(submitBg);
    
    const submitLabel = document.createElement('a-text');
    submitLabel.setAttribute('value', 'SUBMIT');
    submitLabel.setAttribute('align', 'center');
    submitLabel.setAttribute('position', '0 0 0.01');
    submitLabel.setAttribute('color', '#000000');
    submitLabel.setAttribute('width', '2.5');
    submitBtn.appendChild(submitLabel);
    
    submitBg.addEventListener('click', () => {
      this.submitResponse();
    });
    
    container.appendChild(submitBtn);
    
    // Close button
    const closeBtn = document.createElement('a-entity');
    closeBtn.setAttribute('position', '-1.8 -1.35 0.02');
    
    const closeBg = document.createElement('a-plane');
    closeBg.setAttribute('width', '1.2');
    closeBg.setAttribute('height', '0.4');
    closeBg.setAttribute('color', '#330000');
    closeBg.setAttribute('class', 'clickable');
    closeBtn.appendChild(closeBg);
    
    const closeBorder = document.createElement('a-plane');
    closeBorder.setAttribute('width', '1.22');
    closeBorder.setAttribute('height', '0.42');
    closeBorder.setAttribute('position', '0 0 -0.005');
    closeBorder.setAttribute('color', '#ff0000');
    closeBorder.setAttribute('opacity', '0.5');
    closeBtn.appendChild(closeBorder);
    
    const closeLabel = document.createElement('a-text');
    closeLabel.setAttribute('value', 'CLOSE');
    closeLabel.setAttribute('align', 'center');
    closeLabel.setAttribute('position', '0 0 0.01');
    closeLabel.setAttribute('color', '#ff0000');
    closeLabel.setAttribute('width', '2.5');
    closeBtn.appendChild(closeLabel);
    
    closeBg.addEventListener('click', () => {
      this.close();
    });
    
    container.appendChild(closeBtn);
    
    // Add to scene
    this.el.appendChild(container);
  },
  
  updateDisplay: function() {
    const display = this.displayText;
    if (display) {
      display.setAttribute('value', this.inputText + '_');
    }
  },
  
  show: function() {
    console.log('Showing keyboard for:', this.data.questionId);
    this.inputText = '';
    this.updateDisplay();
    this.keyboard.setAttribute('visible', 'true');
  },
  
  close: function() {
    this.keyboard.setAttribute('visible', 'false');
    this.inputText = '';
    this.updateDisplay();
  },
  
  async submitResponse() {
    if (this.inputText.trim() === '') {
      console.log('Empty response, not submitting');
      return;
    }
    
    console.log('Submitting response:', this.inputText, 'for question:', this.data.questionId);
    
    // Save to Supabase and get the response object with position data
    const savedResponse = await ResponseStorage.save(this.data.questionId, this.inputText);
    
    if (savedResponse) {
      // Find the responses container
      const container = document.querySelector(`#responses-${this.data.questionId}`);
      if (container) {
        this.createResponseCard(
          savedResponse.text, 
          container, 
          savedResponse.position, 
          savedResponse.rotation
        );
      } else {
        console.warn('Response container not found for:', this.data.questionId);
      }
    } else {
      console.error('Failed to save response to Supabase');
    }
    
    // Close keyboard
    this.close();
  },
  
  /**
   * Creates a cyberpunk-styled response card BEHIND the question panel
   * @param {string} text - The response text
   * @param {Element} container - The container entity to add the card to
   * @param {Object} position - {x, y, z} position (z should be negative for behind)
   * @param {Object} rotation - {x, y, z} rotation values
   */
  createResponseCard: function(text, container, position, rotation) {
    const card = document.createElement('a-entity');
    
    // Position BEHIND the question panel (negative Z creates the forest effect)
    card.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
    card.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
    
    // Main background panel (dark)
    const cardBg = document.createElement('a-plane');
    cardBg.setAttribute('width', '2.2');
    cardBg.setAttribute('height', '1.3');
    cardBg.setAttribute('color', '#000000');
    cardBg.setAttribute('opacity', '0.9');
    card.appendChild(cardBg);
    
    // Neon red border frame
    const border = document.createElement('a-plane');
    border.setAttribute('width', '2.25');
    border.setAttribute('height', '1.35');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.6');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    card.appendChild(border);
    
    // Corner accents - TOP LEFT
    const cornerTL = document.createElement('a-box');
    cornerTL.setAttribute('width', '0.25');
    cornerTL.setAttribute('height', '0.04');
    cornerTL.setAttribute('depth', '0.01');
    cornerTL.setAttribute('position', '-0.95 0.6 0.01');
    cornerTL.setAttribute('color', '#ff0000');
    cornerTL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTL);
    
    const cornerTLv = document.createElement('a-box');
    cornerTLv.setAttribute('width', '0.04');
    cornerTLv.setAttribute('height', '0.25');
    cornerTLv.setAttribute('depth', '0.01');
    cornerTLv.setAttribute('position', '-1.05 0.5 0.01');
    cornerTLv.setAttribute('color', '#ff0000');
    cornerTLv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTLv);
    
    // Corner accents - TOP RIGHT
    const cornerTR = document.createElement('a-box');
    cornerTR.setAttribute('width', '0.25');
    cornerTR.setAttribute('height', '0.04');
    cornerTR.setAttribute('depth', '0.01');
    cornerTR.setAttribute('position', '0.95 0.6 0.01');
    cornerTR.setAttribute('color', '#ff0000');
    cornerTR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTR);
    
    const cornerTRv = document.createElement('a-box');
    cornerTRv.setAttribute('width', '0.04');
    cornerTRv.setAttribute('height', '0.25');
    cornerTRv.setAttribute('depth', '0.01');
    cornerTRv.setAttribute('position', '1.05 0.5 0.01');
    cornerTRv.setAttribute('color', '#ff0000');
    cornerTRv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTRv);
    
    // Corner accents - BOTTOM LEFT
    const cornerBL = document.createElement('a-box');
    cornerBL.setAttribute('width', '0.25');
    cornerBL.setAttribute('height', '0.04');
    cornerBL.setAttribute('depth', '0.01');
    cornerBL.setAttribute('position', '-0.95 -0.6 0.01');
    cornerBL.setAttribute('color', '#ff0000');
    cornerBL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBL);
    
    const cornerBLv = document.createElement('a-box');
    cornerBLv.setAttribute('width', '0.04');
    cornerBLv.setAttribute('height', '0.25');
    cornerBLv.setAttribute('depth', '0.01');
    cornerBLv.setAttribute('position', '-1.05 -0.5 0.01');
    cornerBLv.setAttribute('color', '#ff0000');
    cornerBLv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBLv);
    
    // Corner accents - BOTTOM RIGHT
    const cornerBR = document.createElement('a-box');
    cornerBR.setAttribute('width', '0.25');
    cornerBR.setAttribute('height', '0.04');
    cornerBR.setAttribute('depth', '0.01');
    cornerBR.setAttribute('position', '0.95 -0.6 0.01');
    cornerBR.setAttribute('color', '#ff0000');
    cornerBR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBR);
    
    const cornerBRv = document.createElement('a-box');
    cornerBRv.setAttribute('width', '0.04');
    cornerBRv.setAttribute('height', '0.25');
    cornerBRv.setAttribute('depth', '0.01');
    cornerBRv.setAttribute('position', '1.05 -0.5 0.01');
    cornerBRv.setAttribute('color', '#ff0000');
    cornerBRv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBRv);
    
    // Diagonal accent stripes (tech aesthetic)
    for (let i = 0; i < 3; i++) {
      const diag = document.createElement('a-box');
      diag.setAttribute('width', '0.15');
      diag.setAttribute('height', '0.02');
      diag.setAttribute('depth', '0.01');
      diag.setAttribute('position', `${-0.85 + i * 0.15} -0.55 0.01`);
      diag.setAttribute('rotation', '0 0 -45');
      diag.setAttribute('color', '#ff0000');
      diag.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2.5');
      card.appendChild(diag);
    }
    
    // Response text
    const cardText = document.createElement('a-text');
    cardText.setAttribute('value', text);
    cardText.setAttribute('align', 'center');
    cardText.setAttribute('position', '0 0 0.02');
    cardText.setAttribute('color', '#ff0000');
    cardText.setAttribute('width', '1.8');
    cardText.setAttribute('wrap-count', '18');
    cardText.setAttribute('line-height', '50');
    card.appendChild(cardText);
    
    // Appear animation (scale in with bounce)
    card.setAttribute('scale', '0 0 0');
    card.setAttribute('animation', {
      property: 'scale',
      to: '1 1 1',
      dur: 600,
      easing: 'easeOutBack'
    });
    
    // Subtle floating animation
    card.setAttribute('animation__float', {
      property: 'position',
      to: `${position.x} ${position.y + 0.1} ${position.z}`,
      dir: 'alternate',
      loop: true,
      dur: 3000 + Math.random() * 2000,
      easing: 'easeInOutSine'
    });
    
    // Add to container
    container.appendChild(card);
    
    console.log(`Created response card at z=${position.z} (behind question panel)`);
  }
});

console.log('vr-keyboard component registered');