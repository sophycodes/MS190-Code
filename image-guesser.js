/**
 * image-guesser.js - Real vs AI Image Guessing Game
 * For the Movement Realm in FIGAROA
 * 
 * Player clicks START to begin, then guesses 5 images
 */

// ============================================
// IMAGE GUESSER COMPONENT
// ============================================
AFRAME.registerComponent('image-guesser', {
  init: function() {
    this.currentRound = 0;
    this.score = 0;
    this.totalRounds = 5;
    this.images = [];
    this.isWaiting = false;
    this.gameStarted = false;
    this.gameEnded = false;

    // ============================================
    // IMAGE DATA
    // ============================================
    this.imageData = [
      // AI Generated Images
      { src: 'assets/imgs/AI/car-AI.jpg', isAI: true },
      { src: 'assets/imgs/AI/face-AI.png', isAI: true },
      { src: 'assets/imgs/AI/flowers-AI.jpg', isAI: true },
      { src: 'assets/imgs/AI/house3-AI.png', isAI: true },
      { src: 'assets/imgs/AI/lion-AI.png', isAI: true },
      { src: 'assets/imgs/AI/NPCeleb-AI.jpg', isAI: true },
      { src: 'assets/imgs/AI/poodle-AI.jpeg', isAI: true },
      
      // Real Images
      { src: 'assets/imgs/Real/car-Real.jpg', isAI: false },
      { src: 'assets/imgs/Real/flowers-Real.png', isAI: false },
      { src: 'assets/imgs/Real/house-Real.jpg', isAI: false },
      { src: 'assets/imgs/Real/lion-Real.jpeg', isAI: false },
      { src: 'assets/imgs/Real/NPCeleb-Real.jpg', isAI: false },
      { src: 'assets/imgs/Real/poodle-Real.png', isAI: false }
    ];

    // Cache DOM elements
    this.imageEl = null;
    this.loadingText = null;
    this.roundCounter = null;
    this.feedbackEl = null;
    this.feedbackText = null;
    this.scoreText = null;
    this.questionText = null;

    console.log('Image Guesser component initialized');

    // Add click handler to START button immediately
    const self = this;
    setTimeout(function() {
      const startBtn = document.querySelector('#btn-start');
      if (startBtn) {
        // Find the clickable box inside the button
        const clickableBox = startBtn.querySelector('.clickable') || startBtn;
        
        if (!clickableBox.hasAttribute('data-handler-added')) {
          console.log('Adding click handler to START button');
          
          clickableBox.addEventListener('click', function() {
            console.log('START clicked');
            self.setupGame();
            self.startGame();
          });

          clickableBox.addEventListener('mouseenter', function() {
            startBtn.setAttribute('scale', '1.1 1.1 1.1');
          });
          
          clickableBox.addEventListener('mouseleave', function() {
            startBtn.setAttribute('scale', '1 1 1');
          });
          
          clickableBox.setAttribute('data-handler-added', 'true');
        }
      }
    }, 1000);

    // Also setup when movement scene is shown (for returning to the realm)
    this.el.sceneEl.addEventListener('scene-changed', function(evt) {
      if (evt.detail && evt.detail.scene === 'movement') {
        console.log('Movement scene activated');
        setTimeout(function() {
          self.setupGame();
        }, 500);
      }
    });
  },

  setupGame: function() {
    // Get DOM elements
    this.imageEl = document.querySelector('#current-game-image');
    this.loadingText = document.querySelector('#loading-text');
    this.roundCounter = document.querySelector('#round-counter');
    this.feedbackEl = document.querySelector('#game-feedback');
    this.feedbackText = document.querySelector('#feedback-text');
    this.scoreText = document.querySelector('#score-text');
    this.questionText = document.querySelector('#game-question');

    if (!this.imageEl) {
      console.warn('Image element not found, retrying...');
      setTimeout(() => this.setupGame(), 500);
      return;
    }

    // Hide answer buttons initially
    const btnReal = document.querySelector('#btn-real');
    const btnAi = document.querySelector('#btn-ai');
    if (btnReal) btnReal.setAttribute('visible', false);
    if (btnAi) btnAi.setAttribute('visible', false);

    // Hide restart button if exists
    const restartBtn = document.querySelector('#btn-restart');
    if (restartBtn) restartBtn.setAttribute('visible', false);

    // Update UI for start screen
    if (this.questionText) {
      this.questionText.setAttribute('value', 'Can you tell REAL from AI?');
    }
    if (this.loadingText) {
      this.loadingText.setAttribute('value', 'Click START to begin!');
      this.loadingText.setAttribute('visible', true);
    }
    if (this.roundCounter) {
      this.roundCounter.setAttribute('value', '5 rounds');
    }
    if (this.scoreText) {
      this.scoreText.setAttribute('value', '');
    }
    if (this.feedbackEl) {
      this.feedbackEl.setAttribute('visible', false);
    }

    // Show start button
    this.createStartButton();

    console.log('Game setup complete, waiting for player to click START');
  },

  createStartButton: function() {
    let startBtn = document.querySelector('#btn-start');
    
    if (startBtn) {
      // Button already exists in HTML, just add click handler if not already added
      if (!startBtn.hasAttribute('data-handler-added')) {
        const self = this;
        startBtn.addEventListener('click', function() {
          console.log('START clicked');
          self.startGame();
        });

        // Add hover effect
        startBtn.addEventListener('mouseenter', function() {
          startBtn.setAttribute('scale', '1.1 1.1 1.1');
        });
        startBtn.addEventListener('mouseleave', function() {
          startBtn.setAttribute('scale', '1 1 1');
        });
        
        startBtn.setAttribute('data-handler-added', 'true');
      }
      
      startBtn.setAttribute('visible', true);
    }
  },

  startGame: function() {
    console.log('Starting game...');

    // Hide start button
    const startBtn = document.querySelector('#btn-start');
    if (startBtn) startBtn.setAttribute('visible', false);

    // Hide restart button
    const restartBtn = document.querySelector('#btn-restart');
    if (restartBtn) restartBtn.setAttribute('visible', false);

    // Reset game state
    this.currentRound = 0;
    this.score = 0;
    this.gameStarted = true;
    this.gameEnded = false;
    this.isWaiting = false;

    // Shuffle all images and pick 5
    this.images = this.shuffleArray([...this.imageData]).slice(0, this.totalRounds);

    // Update UI
    if (this.questionText) {
      this.questionText.setAttribute('value', 'REAL or AI?');
    }
    if (this.loadingText) {
      this.loadingText.setAttribute('visible', false);
    }
    
    // Show answer buttons
    const btnReal = document.querySelector('#btn-real');
    const btnAi = document.querySelector('#btn-ai');
    if (btnReal) btnReal.setAttribute('visible', true);
    if (btnAi) btnAi.setAttribute('visible', true);

    this.updateScore();
    this.showImage(0);

    console.log('Game started with', this.totalRounds, 'images');
  },

  shuffleArray: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  showImage: function(index) {
    if (index >= this.totalRounds) {
      this.endGame();
      return;
    }

    const imageData = this.images[index];

    // Hide feedback from previous round
    if (this.feedbackEl) {
      this.feedbackEl.setAttribute('visible', false);
    }

    // Update image
    if (this.imageEl) {
      this.imageEl.setAttribute('material', 'src', imageData.src);
      this.imageEl.setAttribute('material', 'shader', 'flat');
    }

    // Update round counter
    if (this.roundCounter) {
      this.roundCounter.setAttribute('value', 'Round ' + (index + 1) + ' of ' + this.totalRounds);
    }

    this.isWaiting = false;
    console.log('Showing image', index + 1, '-', imageData.src, '- isAI:', imageData.isAI);
  },

  checkAnswer: function(guessedAI) {
    if (this.isWaiting || !this.gameStarted || this.gameEnded) return;
    this.isWaiting = true;

    const current = this.images[this.currentRound];
    const correct = guessedAI === current.isAI;

    if (correct) {
      this.score++;
      this.showFeedback('CORRECT!', '#00ff00');
    } else {
      const actualType = current.isAI ? 'AI-GENERATED' : 'REAL';
      this.showFeedback('Wrong! ' + actualType, '#ff4444');
    }

    this.updateScore();

    // Next round after delay
    const self = this;
    setTimeout(function() {
      self.currentRound++;
      if (self.currentRound < self.totalRounds) {
        self.showImage(self.currentRound);
      } else {
        self.endGame();
      }
    }, 2000);
  },

  showFeedback: function(text, color) {
    if (this.feedbackEl && this.feedbackText) {
      this.feedbackText.setAttribute('value', text);
      this.feedbackText.setAttribute('color', color);
      this.feedbackEl.setAttribute('visible', true);
    }
  },

  updateScore: function() {
    if (this.scoreText) {
      this.scoreText.setAttribute('value', 'Score: ' + this.score + ' / ' + this.totalRounds);
    }
  },

  endGame: function() {
    this.gameEnded = true;
    this.gameStarted = false;
    
    const percentage = Math.round((this.score / this.totalRounds) * 100);
    
    let message = 'GAME OVER! Score: ' + this.score + '/' + this.totalRounds + ' (' + percentage + '%) - ';

    if (percentage === 100) {
      message += 'PERFECT!';
    } else if (percentage >= 80) {
      message += 'Excellent!';
    } else if (percentage >= 60) {
      message += 'Good job!';
    } else if (percentage >= 40) {
      message += 'Not bad!';
    } else {
      message += 'AI fooled you!';
    }

    // Show final message
    this.showFeedback(message, '#00ffff');

    // Update question text
    if (this.questionText) {
      this.questionText.setAttribute('value', 'Click RESTART to play again!');
    }

    // Hide answer buttons
    const btnReal = document.querySelector('#btn-real');
    const btnAi = document.querySelector('#btn-ai');
    if (btnReal) btnReal.setAttribute('visible', false);
    if (btnAi) btnAi.setAttribute('visible', false);

    // Show restart button
    this.createRestartButton();

    console.log('Game ended. Final score:', this.score, '/', this.totalRounds);
  },

  createRestartButton: function() {
    let restartBtn = document.querySelector('#btn-restart');
    
    if (!restartBtn) {
      const buttonsContainer = document.querySelector('#answer-buttons');
      
      restartBtn = document.createElement('a-entity');
      restartBtn.setAttribute('id', 'btn-restart');
      restartBtn.setAttribute('class', 'clickable');
      restartBtn.setAttribute('position', '0 0 0');
      
      // Create button elements
      const glowBox = document.createElement('a-box');
      glowBox.setAttribute('width', '3');
      glowBox.setAttribute('height', '1');
      glowBox.setAttribute('depth', '0.15');
      glowBox.setAttribute('position', '0 0 -0.05');
      glowBox.setAttribute('material', 'color: #00ffff; shader: flat; opacity: 0.3');
      
      const mainBox = document.createElement('a-box');
      mainBox.setAttribute('width', '2.8');
      mainBox.setAttribute('height', '0.8');
      mainBox.setAttribute('depth', '0.2');
      mainBox.setAttribute('material', 'color: #004444');
      
      const text = document.createElement('a-text');
      text.setAttribute('value', 'RESTART');
      text.setAttribute('align', 'center');
      text.setAttribute('position', '0 0 0.11');
      text.setAttribute('color', '#00ffff');
      text.setAttribute('width', '6');
      
      restartBtn.appendChild(glowBox);
      restartBtn.appendChild(mainBox);
      restartBtn.appendChild(text);
      
      buttonsContainer.appendChild(restartBtn);

      // Add click handler
      const self = this;
      restartBtn.addEventListener('click', function() {
        console.log('Restart clicked');
        self.startGame();
      });

      // Add hover effect
      restartBtn.addEventListener('mouseenter', function() {
        restartBtn.setAttribute('scale', '1.1 1.1 1.1');
      });
      restartBtn.addEventListener('mouseleave', function() {
        restartBtn.setAttribute('scale', '1 1 1');
      });
    }

    restartBtn.setAttribute('visible', true);
  }
});


// ============================================
// ANSWER BUTTON COMPONENT
// ============================================
AFRAME.registerComponent('game-answer-button', {
  schema: {
    answer: { type: 'string', default: 'real' }
  },

  init: function() {
    const el = this.el;
    const answer = this.data.answer;
    const isAI = answer === 'ai';

    console.log('Answer button component initialized:', answer);

    // Click handler
    el.addEventListener('click', function(evt) {
      console.log('>>> ANSWER BUTTON CLICKED:', answer, '<<<');
      
      // Stop event propagation
      evt.stopPropagation();
      
      // Find the image-guesser component
      const guesser = document.querySelector('[image-guesser]');
      if (guesser && guesser.components['image-guesser']) {
        guesser.components['image-guesser'].checkAnswer(isAI);
      } else {
        console.warn('Image guesser not found');
      }

      // Visual feedback on parent
      const parent = el.parentElement;
      if (parent) {
        parent.setAttribute('scale', '0.9 0.9 0.9');
        setTimeout(function() {
          parent.setAttribute('scale', '1 1 1');
        }, 150);
      }
    });

    // Hover effects on parent
    el.addEventListener('mouseenter', function() {
      const parent = el.parentElement;
      if (parent) parent.setAttribute('scale', '1.1 1.1 1.1');
    });

    el.addEventListener('mouseleave', function() {
      const parent = el.parentElement;
      if (parent) parent.setAttribute('scale', '1 1 1');
    });
  }
});


// ============================================
// START GAME BUTTON COMPONENT
// ============================================
AFRAME.registerComponent('start-game-button', {
  init: function() {
    const el = this.el;
    
    console.log('Start game button component initialized');

    // Click handler
    el.addEventListener('click', function(evt) {
      console.log('>>> START GAME BUTTON CLICKED <<<');
      
      // Stop event propagation to prevent keyboard from catching it
      evt.stopPropagation();
      
      // Find the image-guesser component
      const guesser = document.querySelector('[image-guesser]');
      if (guesser && guesser.components['image-guesser']) {
        const game = guesser.components['image-guesser'];
        game.setupGame();
        game.startGame();
      } else {
        console.warn('Image guesser not found');
      }

      // Hide the start button
      const startBtn = document.querySelector('#btn-start');
      if (startBtn) {
        startBtn.setAttribute('visible', false);
      }
    });

    // Hover effects
    el.addEventListener('mouseenter', function() {
      const parent = document.querySelector('#btn-start');
      if (parent) parent.setAttribute('scale', '1.1 1.1 1.1');
    });

    el.addEventListener('mouseleave', function() {
      const parent = document.querySelector('#btn-start');
      if (parent) parent.setAttribute('scale', '1 1 1');
    });
  }
});