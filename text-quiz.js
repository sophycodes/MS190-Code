/**
 * text-quiz.js - Fact vs Misinformation Quiz Game
 * 
 * 3x3 grid of cards - user picks 5 they think are TRUE facts
 * After 5 selections, all cards reveal:
 * Green = was a fact (correct if selected, missed if not)
 * Dark red = was misinformation (wrong if selected)
 */

console.log('=== text-quiz.js FILE LOADED ===');

AFRAME.registerComponent('text-quiz', {
  schema: {
    active: { type: 'boolean', default: false }
  },

  init: function() {
    console.log('>>> TEXT QUIZ INIT <<<');
    
    // All the facts (TRUE statements)
    this.facts = [
      "People in the EU have strong data rights under GDPR law—like accessing, correcting, deleting, and moving their data. The U.S. has no comparable nationwide law.",
      "By 2013, about 98% of all information on Earth had already been converted into digital form.",
      "The internet began as a Cold War U.S. military project designed to survive a nuclear attack.",
      "Today, the world generates roughly 402 million terabytes of new data every single day.",
      "A European user's data is shared with advertisers about 376 times per day—Americans nearly twice that at 747 times.",
      "Before machines existed, 'computers' were actually human mathematicians—many of the first were women hired to do complex calculations.",
      "The world's first computer programmer was a woman: Ada Lovelace, who wrote algorithms for Babbage's early calculating machine.",
      "Charles Babbage, the 'father of the computer,' designed 19th-century mechanical calculators to produce error-free tables."
    ];
    
    // All the misinformation (FALSE statements)
    this.lies = [
      "Clearing your browser history permanently removes all traces of your online activity from company servers.",
      "Private browsing mode makes you completely anonymous and untraceable online.",
      "If a website has a privacy policy, it means they cannot legally sell your data to third parties.",
      "Computers can only understand data that humans have manually programmed them to recognize.",
      "Charles Babbage successfully completed and demonstrated his Analytical Engine to Queen Victoria in 1842.",
      "ENIAC, the first electronic computer, was originally designed to predict weather patterns for farmers.",
      "Binary code (1s and 0s) was invented specifically for computers in the 1940s by IBM engineers."
    ];
    
    // Game state
    this.score = 0;
    this.selectionsRemaining = 5;
    this.totalCards = 9;
    this.gameCards = [];
    this.cardEntities = [];
    this.gameStarted = false;
    
    // Create intro panel (always visible until game starts)
    this.createIntroPanel();
    
    // Create game container (hidden until game starts)
    this.gameContainer = document.createElement('a-entity');
    this.gameContainer.setAttribute('id', 'quiz-game-container');
    this.gameContainer.setAttribute('visible', 'false');
    this.el.appendChild(this.gameContainer);
  },
  
  createIntroPanel: function() {
    const introPanel = document.createElement('a-entity');
    introPanel.setAttribute('id', 'quiz-intro-panel');
    introPanel.setAttribute('position', '0 4 0');
    
    // Neon Box Frame (same style as other corners)
    const panelBg = document.createElement('a-plane');
    panelBg.setAttribute('width', '8');
    panelBg.setAttribute('height', '6');
    panelBg.setAttribute('color', '#000000');
    panelBg.setAttribute('opacity', '0.7');
    introPanel.appendChild(panelBg);
    
    // Neon border glow
    const border = document.createElement('a-plane');
    border.setAttribute('width', '8.2');
    border.setAttribute('height', '6.2');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.4');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    introPanel.appendChild(border);
    
    // Title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'FACT OR\nMISSINFORMATION?');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 2 0.1');
    title.setAttribute('color', '#ff0000');
    title.setAttribute('width', '6');
    title.setAttribute('line-height', '50');
    introPanel.appendChild(title);
    
    // Instructions
    const instructions = document.createElement('a-text');
    instructions.setAttribute('value', '9 cards will appear.\n5 are TRUE facts.\n4 are MISINFORMATION.\n\nSelect the 5 cards you\nthink are TRUE.\n\nAfter 5 selections,\nall answers will reveal!');
    instructions.setAttribute('align', 'center');
    instructions.setAttribute('position', '0 -0.3 0.1');
    instructions.setAttribute('color', '#ff0000');
    instructions.setAttribute('width', '4');
    instructions.setAttribute('line-height', '55');
    instructions.setAttribute('opacity', '0.8');
    introPanel.appendChild(instructions);
    
    // START GAME button
    const startBtn = document.createElement('a-entity');
    startBtn.setAttribute('position', '0 -2.3 0.1');
    
    const btnBg = document.createElement('a-box');
    btnBg.setAttribute('width', '3.5');
    btnBg.setAttribute('height', '0.8');
    btnBg.setAttribute('depth', '0.2');
    btnBg.setAttribute('color', '#ff0000');
    btnBg.setAttribute('class', 'clickable');
    btnBg.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 1');
    startBtn.appendChild(btnBg);
    
    const btnText = document.createElement('a-text');
    btnText.setAttribute('value', 'START GAME');
    btnText.setAttribute('align', 'center');
    btnText.setAttribute('position', '0 0 0.15');
    btnText.setAttribute('color', '#000000');
    btnText.setAttribute('width', '6');
    startBtn.appendChild(btnText);
    
    // Click handler
    btnBg.addEventListener('click', () => {
      console.log('Start quiz clicked!');
      this.startGame();
    });
    
    introPanel.appendChild(startBtn);
    
    this.introPanel = introPanel;
    this.el.appendChild(introPanel);
  },
  
  startGame: function() {
    console.log('Starting quiz game...');
    
    // Reset state
    this.score = 0;
    this.selectionsRemaining = 5;
    this.gameStarted = true;
    
    // Hide intro panel
    this.introPanel.setAttribute('visible', 'false');
    
    // Show game container
    this.gameContainer.setAttribute('visible', 'true');
    
    // Clear old cards
    this.cardEntities.forEach(card => {
      if (card.parentNode) card.parentNode.removeChild(card);
    });
    this.cardEntities = [];
    
    // Select 5 random facts and 4 random lies
    const selectedFacts = this.shuffleArray([...this.facts]).slice(0, 5);
    const selectedLies = this.shuffleArray([...this.lies]).slice(0, 4);
    
    // Combine and shuffle
    this.gameCards = this.shuffleArray([
      ...selectedFacts.map(text => ({ text, isFact: true, selected: false })),
      ...selectedLies.map(text => ({ text, isFact: false, selected: false }))
    ]);
    
    // Create 3x3 grid of cards
    this.createCardGrid();
    
    // Create score display
    this.createScoreDisplay();
  },
  
  createCardGrid: function() {
    const gridConfig = {
      cols: 3,
      rows: 3,
      cardWidth: 3.5,
      cardHeight: 2.5,
      spacingX: 4,
      spacingY: 3,
      startY: 8,
      startZ: 0
    };
    
    this.gameCards.forEach((cardData, index) => {
      const col = index % gridConfig.cols;
      const row = Math.floor(index / gridConfig.cols);
      
      const x = (col - 1) * gridConfig.spacingX;
      const y = gridConfig.startY - (row * gridConfig.spacingY);
      const z = gridConfig.startZ;
      
      const card = this.createQuizCard(cardData, index, x, y, z, gridConfig.cardWidth, gridConfig.cardHeight);
      this.gameContainer.appendChild(card);
      this.cardEntities.push(card);
    });
  },
  
  createQuizCard: function(cardData, index, x, y, z, width, height) {
    const card = document.createElement('a-entity');
    card.setAttribute('position', `${x} ${y} ${z}`);
    card.setAttribute('data-index', index);
    
    // Card background
    const cardBg = document.createElement('a-plane');
    cardBg.setAttribute('width', width);
    cardBg.setAttribute('height', height);
    cardBg.setAttribute('color', '#1a0000');
    cardBg.setAttribute('class', 'clickable quiz-card');
    cardBg.setAttribute('data-index', index);
    card.appendChild(cardBg);
    
    // Neon border
    const border = document.createElement('a-plane');
    border.setAttribute('width', width + 0.1);
    border.setAttribute('height', height + 0.1);
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.6');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    card.appendChild(border);
    
    // Store references for color changes
    card.borderEl = border;
    card.bgEl = cardBg;
    
    // Corner accents (top-left)
    const cornerTL = document.createElement('a-box');
    cornerTL.setAttribute('width', '0.4');
    cornerTL.setAttribute('height', '0.06');
    cornerTL.setAttribute('depth', '0.01');
    cornerTL.setAttribute('position', `${-width/2 + 0.2} ${height/2 - 0.1} 0.01`);
    cornerTL.setAttribute('color', '#ff0000');
    cornerTL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTL);
    card.cornerTL = cornerTL;
    
    const cornerTLv = document.createElement('a-box');
    cornerTLv.setAttribute('width', '0.06');
    cornerTLv.setAttribute('height', '0.4');
    cornerTLv.setAttribute('depth', '0.01');
    cornerTLv.setAttribute('position', `${-width/2 + 0.1} ${height/2 - 0.2} 0.01`);
    cornerTLv.setAttribute('color', '#ff0000');
    cornerTLv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTLv);
    card.cornerTLv = cornerTLv;
    
    // Corner accents (top-right)
    const cornerTR = document.createElement('a-box');
    cornerTR.setAttribute('width', '0.4');
    cornerTR.setAttribute('height', '0.06');
    cornerTR.setAttribute('depth', '0.01');
    cornerTR.setAttribute('position', `${width/2 - 0.2} ${height/2 - 0.1} 0.01`);
    cornerTR.setAttribute('color', '#ff0000');
    cornerTR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTR);
    card.cornerTR = cornerTR;
    
    const cornerTRv = document.createElement('a-box');
    cornerTRv.setAttribute('width', '0.06');
    cornerTRv.setAttribute('height', '0.4');
    cornerTRv.setAttribute('depth', '0.01');
    cornerTRv.setAttribute('position', `${width/2 - 0.1} ${height/2 - 0.2} 0.01`);
    cornerTRv.setAttribute('color', '#ff0000');
    cornerTRv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerTRv);
    card.cornerTRv = cornerTRv;
    
    // Corner accents (bottom-left)
    const cornerBL = document.createElement('a-box');
    cornerBL.setAttribute('width', '0.4');
    cornerBL.setAttribute('height', '0.06');
    cornerBL.setAttribute('depth', '0.01');
    cornerBL.setAttribute('position', `${-width/2 + 0.2} ${-height/2 + 0.1} 0.01`);
    cornerBL.setAttribute('color', '#ff0000');
    cornerBL.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBL);
    card.cornerBL = cornerBL;
    
    const cornerBLv = document.createElement('a-box');
    cornerBLv.setAttribute('width', '0.06');
    cornerBLv.setAttribute('height', '0.4');
    cornerBLv.setAttribute('depth', '0.01');
    cornerBLv.setAttribute('position', `${-width/2 + 0.1} ${-height/2 + 0.2} 0.01`);
    cornerBLv.setAttribute('color', '#ff0000');
    cornerBLv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBLv);
    card.cornerBLv = cornerBLv;
    
    // Corner accents (bottom-right)
    const cornerBR = document.createElement('a-box');
    cornerBR.setAttribute('width', '0.4');
    cornerBR.setAttribute('height', '0.06');
    cornerBR.setAttribute('depth', '0.01');
    cornerBR.setAttribute('position', `${width/2 - 0.2} ${-height/2 + 0.1} 0.01`);
    cornerBR.setAttribute('color', '#ff0000');
    cornerBR.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBR);
    card.cornerBR = cornerBR;
    
    const cornerBRv = document.createElement('a-box');
    cornerBRv.setAttribute('width', '0.06');
    cornerBRv.setAttribute('height', '0.4');
    cornerBRv.setAttribute('depth', '0.01');
    cornerBRv.setAttribute('position', `${width/2 - 0.1} ${-height/2 + 0.2} 0.01`);
    cornerBRv.setAttribute('color', '#ff0000');
    cornerBRv.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 3');
    card.appendChild(cornerBRv);
    card.cornerBRv = cornerBRv;
    
    // Store all corners for easy color updates
    card.corners = [cornerTL, cornerTLv, cornerTR, cornerTRv, cornerBL, cornerBLv, cornerBR, cornerBRv];
    
    // Card text
    const cardText = document.createElement('a-text');
    cardText.setAttribute('value', cardData.text);
    cardText.setAttribute('align', 'center');
    cardText.setAttribute('position', '0 0 0.02');
    cardText.setAttribute('color', '#ff0000');
    cardText.setAttribute('width', width - 0.5);
    cardText.setAttribute('wrap-count', '30');
    cardText.setAttribute('line-height', '50');
    card.appendChild(cardText);
    
    // Store text reference for color change
    card.textEl = cardText;
    
    // Click handler
    cardBg.addEventListener('click', () => {
      this.handleCardClick(index, card);
    });
    
    // Appear animation
    card.setAttribute('scale', '0 0 0');
    card.setAttribute('animation', {
      property: 'scale',
      to: '1 1 1',
      dur: 400,
      delay: index * 100,
      easing: 'easeOutBack'
    });
    
    return card;
  },
  
  createScoreDisplay: function() {
    // Remove old score display if exists
    const oldScore = this.gameContainer.querySelector('#score-display');
    if (oldScore) oldScore.parentNode.removeChild(oldScore);
    
    const scoreDisplay = document.createElement('a-entity');
    scoreDisplay.setAttribute('id', 'score-display');
    scoreDisplay.setAttribute('position', '0 11 0');
    
    const scoreText = document.createElement('a-text');
    scoreText.setAttribute('id', 'score-text');
    scoreText.setAttribute('value', 'SELECTIONS LEFT: 5');
    scoreText.setAttribute('align', 'center');
    scoreText.setAttribute('color', '#ff0000');
    scoreText.setAttribute('width', '10');
    scoreDisplay.appendChild(scoreText);
    
    const instruction = document.createElement('a-text');
    instruction.setAttribute('value', 'Select the 5 cards you think are TRUE FACTS');
    instruction.setAttribute('align', 'center');
    instruction.setAttribute('position', '0 -0.8 0');
    instruction.setAttribute('color', '#ff0000');
    instruction.setAttribute('width', '6');
    instruction.setAttribute('opacity', '0.7');
    scoreDisplay.appendChild(instruction);
    
    this.scoreDisplay = scoreDisplay;
    this.gameContainer.appendChild(scoreDisplay);
  },
  
  handleCardClick: function(index, cardEntity) {
    const cardData = this.gameCards[index];
    
    // Ignore if already selected or no selections left
    if (cardData.selected) {
      console.log('Card already selected');
      return;
    }
    
    if (this.selectionsRemaining <= 0) {
      console.log('No selections remaining');
      return;
    }
    
    // Mark as selected
    cardData.selected = true;
    this.selectionsRemaining--;
    
    // Visual feedback - highlight selected card (cyan/teal color)
    this.highlightSelected(cardEntity);
    
    // Update selections display
    const scoreText = this.gameContainer.querySelector('#score-text');
    if (scoreText) {
      scoreText.setAttribute('value', `SELECTIONS LEFT: ${this.selectionsRemaining}`);
    }
    
    console.log(`Card selected. ${this.selectionsRemaining} selections remaining.`);
    
    // Check if all 5 selections made
    if (this.selectionsRemaining <= 0) {
      console.log('All selections made! Revealing answers...');
      setTimeout(() => this.revealAllCards(), 1000);
    }
  },
  
  highlightSelected: function(cardEntity) {
    // Change to cyan/teal to show it's selected (before reveal)
    const selectedColor = '#00ffff';
    const selectedBgColor = '#001a1a';
    
    cardEntity.borderEl.setAttribute('color', selectedColor);
    cardEntity.borderEl.setAttribute('material', 'shader: flat; emissive: #00ffff; emissiveIntensity: 2');
    cardEntity.bgEl.setAttribute('color', selectedBgColor);
    cardEntity.textEl.setAttribute('color', selectedColor);
    
    // Update corners
    cardEntity.corners.forEach(corner => {
      corner.setAttribute('color', selectedColor);
      corner.setAttribute('material', 'shader: flat; emissive: #00ffff; emissiveIntensity: 3');
    });
  },
  
  revealAllCards: function() {
    console.log('Revealing all cards...');
    
    this.score = 0;
    
    this.gameCards.forEach((cardData, index) => {
      const cardEntity = this.cardEntities[index];
      
      if (cardData.isFact) {
        // This was a TRUE fact
        if (cardData.selected) {
          // Correctly identified - GREEN
          this.score++;
          this.setCardColor(cardEntity, '#00ff00', '#001a00', 'CORRECT!');
        } else {
          // Missed this fact - YELLOW/ORANGE (you should have picked this)
          this.setCardColor(cardEntity, '#ffaa00', '#1a1100', 'MISSED FACT');
        }
      } else {
        // This was MISINFORMATION
        if (cardData.selected) {
          // Wrong! Selected misinformation - DARK RED
          this.setCardColor(cardEntity, '#ff0000', '#220000', 'WRONG!');
        } else {
          // Correctly avoided - DIM (neutral)
          this.setCardColor(cardEntity, '#444444', '#111111', 'MISINFORMATION');
        }
      }
    });
    
    // Update display to show score
    const scoreText = this.gameContainer.querySelector('#score-text');
    if (scoreText) {
      scoreText.setAttribute('value', `SCORE: ${this.score} / 5`);
    }
    
    // End game after showing results
    setTimeout(() => this.endGame(), 4000);
  },
  
  setCardColor: function(cardEntity, color, bgColor, labelText) {
    cardEntity.borderEl.setAttribute('color', color);
    cardEntity.borderEl.setAttribute('material', `shader: flat; emissive: ${color}; emissiveIntensity: 2`);
    cardEntity.bgEl.setAttribute('color', bgColor);
    cardEntity.textEl.setAttribute('color', color);
    
    // Update corners
    cardEntity.corners.forEach(corner => {
      corner.setAttribute('color', color);
      corner.setAttribute('material', `shader: flat; emissive: ${color}; emissiveIntensity: 3`);
    });
    
    // Add result label above card
    const label = document.createElement('a-text');
    label.setAttribute('value', labelText);
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 1.5 0.1');
    label.setAttribute('color', color);
    label.setAttribute('width', '4');
    label.setAttribute('opacity', '0.9');
    cardEntity.appendChild(label);
  },
  
  endGame: function() {
    console.log('Game over! Final score:', this.score);
    
    // Hide game container
    this.gameContainer.setAttribute('visible', 'false');
    
    // Show end screen
    this.showEndScreen();
  },
  
  showEndScreen: function() {
    // Remove old end screen if exists
    const oldEnd = this.el.querySelector('#end-screen');
    if (oldEnd) oldEnd.parentNode.removeChild(oldEnd);
    
    const endScreen = document.createElement('a-entity');
    endScreen.setAttribute('id', 'end-screen');
    endScreen.setAttribute('position', '0 4 0');
    
    // Background panel
    const panelBg = document.createElement('a-plane');
    panelBg.setAttribute('width', '8');
    panelBg.setAttribute('height', '6');
    panelBg.setAttribute('color', '#000000');
    panelBg.setAttribute('opacity', '0.7');
    endScreen.appendChild(panelBg);
    
    // Neon border
    const border = document.createElement('a-plane');
    border.setAttribute('width', '8.2');
    border.setAttribute('height', '6.2');
    border.setAttribute('position', '0 0 -0.01');
    border.setAttribute('color', '#ff0000');
    border.setAttribute('opacity', '0.4');
    border.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 2');
    endScreen.appendChild(border);
    
    // Result message
    let message = '';
    if (this.score === 5) {
      message = 'PERFECT!\nYou spotted all the facts!';
    } else if (this.score >= 4) {
      message = 'EXCELLENT!\nYou can spot the truth!';
    } else if (this.score >= 3) {
      message = 'NOT BAD!\nBut stay vigilant.';
    } else if (this.score >= 2) {
      message = 'BE CAREFUL!\nMisinformation is tricky.';
    } else {
      message = 'WATCH OUT!\nDon\'t believe everything\nyou read.';
    }
    
    const resultText = document.createElement('a-text');
    resultText.setAttribute('value', message);
    resultText.setAttribute('align', 'center');
    resultText.setAttribute('position', '0 1.5 0.1');
    resultText.setAttribute('color', '#ff0000');
    resultText.setAttribute('width', '6');
    resultText.setAttribute('line-height', '55');
    endScreen.appendChild(resultText);
    
    // Final score
    const finalScore = document.createElement('a-text');
    finalScore.setAttribute('value', `FINAL SCORE: ${this.score} / 5`);
    finalScore.setAttribute('align', 'center');
    finalScore.setAttribute('position', '0 -0.3 0.1');
    finalScore.setAttribute('color', '#ffffff');
    finalScore.setAttribute('width', '8');
    endScreen.appendChild(finalScore);
    
    // Play again button
    const playAgainBtn = document.createElement('a-entity');
    playAgainBtn.setAttribute('position', '0 -2 0.1');
    
    const btnBg = document.createElement('a-box');
    btnBg.setAttribute('width', '3.5');
    btnBg.setAttribute('height', '0.8');
    btnBg.setAttribute('depth', '0.2');
    btnBg.setAttribute('color', '#ff0000');
    btnBg.setAttribute('class', 'clickable');
    btnBg.setAttribute('material', 'shader: flat; emissive: #ff0000; emissiveIntensity: 1');
    playAgainBtn.appendChild(btnBg);
    
    const btnText = document.createElement('a-text');
    btnText.setAttribute('value', 'PLAY AGAIN');
    btnText.setAttribute('align', 'center');
    btnText.setAttribute('position', '0 0 0.15');
    btnText.setAttribute('color', '#000000');
    btnText.setAttribute('width', '6');
    playAgainBtn.appendChild(btnText);
    
    btnBg.addEventListener('click', () => {
      endScreen.parentNode.removeChild(endScreen);
      this.startGame();
    });
    
    endScreen.appendChild(playAgainBtn);
    
    // Animation
    endScreen.setAttribute('scale', '0 0 0');
    endScreen.setAttribute('animation', {
      property: 'scale',
      to: '1 1 1',
      dur: 500,
      easing: 'easeOutBack'
    });
    
    this.el.appendChild(endScreen);
  },
  
  shuffleArray: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});

console.log('text-quiz component registered');