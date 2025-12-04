/**
 * audio-guesser.js - Audio guessing game component
 * Single sphere plays either REAL or AI audio, user guesses which
 */

console.log('=== audio-guesser.js FILE LOADED ===');

AFRAME.registerComponent('audio-guesser', {
  schema: {},
  
  init: function() {
    console.log('>>> AUDIO GUESSER INIT <<<');
    
    // Game state
    this.currentRound = 0;
    this.totalRounds = 5;
    this.score = 0;
    this.gameActive = false;
    this.audioPlaying = false;
    this.currentAnswer = null; // 'real' or 'ai'
    
    // Audio file lists
    this.realAudioFiles = [
      'assets/audio/Real/cafe_chatter-Real.mp3',
      'assets/audio/Real/classical-Real.mp3',
      'assets/audio/Real/cyber-Real.mp3',
      'assets/audio/Real/moi-Real.mp3',
      'assets/audio/Real/spanish-Real.mp3',
      'assets/audio/Real/violin-Real.mp3'
    ];
    
    this.aiAudioFiles = [
      'assets/audio/AI/cafe_chatter-AI.mp3',
      'assets/audio/AI/classical-AI.mp3',
      'assets/audio/AI/cyberpunk-AI.mp3',
      'assets/audio/AI/moi-AI.mp3',
      'assets/audio/AI/spanish-AI.mp3',
      'assets/audio/AI/violin-AI.mp3'
    ];
    
    // Shuffle arrays
    this.shuffleArray(this.realAudioFiles);
    this.shuffleArray(this.aiAudioFiles);
    
    // Create game pool (mix of real and AI)
    this.createGamePool();
    
    // Setup UI elements
    this.setupUI();
  },
  
  shuffleArray: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },
  
  createGamePool: function() {
    // Create a pool of 5 audio clips (mix of real and AI)
    this.gamePool = [];
    
    // Add 2-3 real and 2-3 AI (randomly)
    const numReal = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const numAI = 5 - numReal; // remaining
    
    for (let i = 0; i < numReal && i < this.realAudioFiles.length; i++) {
      this.gamePool.push({
        url: this.realAudioFiles[i],
        type: 'real'
      });
    }
    
    for (let i = 0; i < numAI && i < this.aiAudioFiles.length; i++) {
      this.gamePool.push({
        url: this.aiAudioFiles[i],
        type: 'ai'
      });
    }
    
    // Shuffle the game pool
    this.shuffleArray(this.gamePool);
    
    console.log('Game pool created:', this.gamePool);
  },
  
  setupUI: function() {
    // Get UI elements
    this.audioSphere = document.querySelector('#audio-play-sphere');
    this.playButton = document.querySelector('#btn-play-audio');
    this.btnReal = document.querySelector('#btn-guess-real');
    this.btnAI = document.querySelector('#btn-guess-ai');
    this.btnStart = document.querySelector('#btn-start-audio-game');
    this.feedbackText = document.querySelector('#audio-feedback-text');
    this.scoreText = document.querySelector('#audio-score-text');
    this.roundText = document.querySelector('#audio-round-text');
    this.instructionText = document.querySelector('#audio-instruction-text');
    
    // Setup start button - use direct click on parent entity to avoid conflicts
    if (this.btnStart) {
      // Add click handler to parent entity instead of nested clickable
      this.btnStart.addEventListener('click', (evt) => {
        console.log('>>> AUDIO START GAME BUTTON CLICKED <<<');
        this.startGame();
        evt.stopPropagation(); // Prevent event bubbling
      });
      
      // Make parent entity itself clickable
      this.btnStart.classList.add('clickable');
    }
    
    // Setup play button - use direct click on parent entity
    if (this.playButton) {
      this.playButton.addEventListener('click', (evt) => {
        console.log('Play audio clicked!');
        this.playCurrentAudio();
        evt.stopPropagation();
      });
      this.playButton.classList.add('clickable');
    }
    
    // Setup answer buttons - use direct click on parent entities
    if (this.btnReal) {
      this.btnReal.addEventListener('click', (evt) => {
        console.log('Guessed REAL');
        this.submitAnswer('real');
        evt.stopPropagation();
      });
      this.btnReal.classList.add('clickable');
    }
    
    if (this.btnAI) {
      this.btnAI.addEventListener('click', (evt) => {
        console.log('Guessed AI');
        this.submitAnswer('ai');
        evt.stopPropagation();
      });
      this.btnAI.classList.add('clickable');
    }
  },
  
  startGame: function() {
    console.log('Starting audio guessing game!');
    
    this.currentRound = 0;
    this.score = 0;
    this.gameActive = true;
    
    // Hide start button
    if (this.btnStart) {
      this.btnStart.setAttribute('visible', 'false');
    }
    
    // Show game elements
    if (this.audioSphere) {
      this.audioSphere.setAttribute('visible', 'true');
    }
    if (this.playButton) {
      this.playButton.setAttribute('visible', 'true');
    }
    
    // Update UI
    this.updateScoreDisplay();
    
    // Load first round
    this.loadNextRound();
  },
  
  loadNextRound: function() {
    if (this.currentRound >= this.totalRounds) {
      this.endGame();
      return;
    }
    
    console.log(`Loading round ${this.currentRound + 1}/${this.totalRounds}`);
    
    // Get current audio from pool
    const audioData = this.gamePool[this.currentRound];
    this.currentAudioUrl = audioData.url;
    this.currentAnswer = audioData.type;
    
    console.log('Current audio:', this.currentAudioUrl, 'Answer:', this.currentAnswer);
    
    // Reset sphere to neutral color
    if (this.audioSphere) {
      this.audioSphere.setAttribute('material', 'color', '#9900ff'); // Purple
    }
    
    // Update round counter
    if (this.roundText) {
      this.roundText.setAttribute('value', `Round ${this.currentRound + 1}/${this.totalRounds}`);
    }
    
    // Update instructions
    if (this.instructionText) {
      this.instructionText.setAttribute('value', 'Click PLAY to hear the audio');
    }
    
    // Hide answer buttons
    if (this.btnReal) this.btnReal.setAttribute('visible', 'false');
    if (this.btnAI) this.btnAI.setAttribute('visible', 'false');
    
    // Show play button
    if (this.playButton) this.playButton.setAttribute('visible', 'true');
    
    // Clear feedback
    if (this.feedbackText) {
      this.feedbackText.setAttribute('value', '');
      this.feedbackText.parentNode.setAttribute('visible', 'false');
    }
  },
  
  playCurrentAudio: function() {
    if (this.audioPlaying) {
      console.log('Audio already playing');
      return;
    }
    
    console.log('Playing audio:', this.currentAudioUrl);
    
    // Update sphere - pulsing while playing
    if (this.audioSphere) {
      this.audioSphere.setAttribute('material', 'color', '#ff00ff'); // Magenta
      this.audioSphere.setAttribute('animation__pulse', {
        property: 'scale',
        from: '1 1 1',
        to: '1.3 1.3 1.3',
        dir: 'alternate',
        loop: true,
        dur: 500
      });
    }
    
    // Update instruction
    if (this.instructionText) {
      this.instructionText.setAttribute('value', 'Listening...');
    }
    
    this.audioPlaying = true;
    
    // Create and play audio
    const audio = new Audio(this.currentAudioUrl);
    this.currentAudio = audio;
    
    audio.onended = () => {
      console.log('Audio finished playing');
      this.audioPlaying = false;
      
      // Reset sphere
      if (this.audioSphere) {
        this.audioSphere.setAttribute('material', 'color', '#9900ff');
        this.audioSphere.removeAttribute('animation__pulse');
      }
      
      // Update instruction
      if (this.instructionText) {
        this.instructionText.setAttribute('value', 'Is this REAL or AI?');
      }
      
      // Hide play button, show answer buttons
      if (this.playButton) this.playButton.setAttribute('visible', 'false');
      if (this.btnReal) this.btnReal.setAttribute('visible', 'true');
      if (this.btnAI) this.btnAI.setAttribute('visible', 'true');
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      this.audioPlaying = false;
      if (this.audioSphere) {
        this.audioSphere.setAttribute('material', 'color', '#9900ff');
        this.audioSphere.removeAttribute('animation__pulse');
      }
    };
    
    audio.play().catch(e => {
      console.error('Failed to play audio:', e);
      this.audioPlaying = false;
    });
  },
  
  submitAnswer: function(guess) {
    if (!this.gameActive) return;
    
    console.log('User guessed:', guess, 'Correct answer:', this.currentAnswer);
    
    const isCorrect = guess === this.currentAnswer;
    
    if (isCorrect) {
      this.score++;
      
      // Green sphere for correct
      if (this.audioSphere) {
        this.audioSphere.setAttribute('material', 'color', '#00ff00');
      }
      
      // Show feedback
      if (this.feedbackText) {
        this.feedbackText.setAttribute('value', '✓ CORRECT!');
        this.feedbackText.setAttribute('color', '#00ff00');
        this.feedbackText.parentNode.setAttribute('visible', 'true');
      }
    } else {
      // Red sphere for incorrect
      if (this.audioSphere) {
        this.audioSphere.setAttribute('material', 'color', '#ff0000');
      }
      
      // Show feedback
      if (this.feedbackText) {
        this.feedbackText.setAttribute('value', `✗ WRONG! It was ${this.currentAnswer.toUpperCase()}`);
        this.feedbackText.setAttribute('color', '#ff0000');
        this.feedbackText.parentNode.setAttribute('visible', 'true');
      }
    }
    
    // Hide answer buttons
    if (this.btnReal) this.btnReal.setAttribute('visible', 'false');
    if (this.btnAI) this.btnAI.setAttribute('visible', 'false');
    
    // Update score
    this.updateScoreDisplay();
    
    // Move to next round after delay
    this.currentRound++;
    setTimeout(() => {
      this.loadNextRound();
    }, 3000);
  },
  
  updateScoreDisplay: function() {
    if (this.scoreText) {
      this.scoreText.setAttribute('value', `Score: ${this.score}/${this.currentRound}`);
    }
  },
  
  endGame: function() {
    console.log('Game ended! Final score:', this.score, '/', this.totalRounds);
    
    this.gameActive = false;
    
    // Hide game elements
    if (this.audioSphere) this.audioSphere.setAttribute('visible', 'false');
    if (this.playButton) this.playButton.setAttribute('visible', 'false');
    if (this.btnReal) this.btnReal.setAttribute('visible', 'false');
    if (this.btnAI) this.btnAI.setAttribute('visible', 'false');
    
    // Show final score
    if (this.feedbackText) {
      const percentage = Math.round((this.score / this.totalRounds) * 100);
      this.feedbackText.setAttribute('value', `GAME OVER!
Score: ${this.score}/${this.totalRounds} (${percentage}%)`);
      this.feedbackText.setAttribute('color', '#00ffff');
      this.feedbackText.parentNode.setAttribute('visible', 'true');
    }
    
    if (this.instructionText) {
      this.instructionText.setAttribute('value', 'Click START to play again');
    }
    
    // Show start button again
    if (this.btnStart) {
      this.btnStart.setAttribute('visible', 'true');
    }
    
    // Recreate game pool for next game
    this.createGamePool();
  }
});

console.log('audio-guesser component registered!');