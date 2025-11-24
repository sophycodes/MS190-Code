/**
 * question-responder.js - Connects RESPOND buttons to VR keyboard
 * 
 * This component attaches to RESPOND buttons in the Text Realm
 * and opens the VR keyboard when clicked.
 */

console.log('=== question-responder.js FILE LOADED ===');

AFRAME.registerComponent('question-responder', {
  schema: {
    questionId: {type: 'string', default: 'question'},
    questionText: {type: 'string', default: 'Question?'}
  },
  
  init: function() {
    console.log('>>> QUESTION RESPONDER INIT <<<', this.data.questionId);
    const data = this.data;
    const self = this;
    
    // Create keyboard instance for this question
    const keyboard = document.createElement('a-entity');
    keyboard.setAttribute('vr-keyboard', {
      questionId: data.questionId,
      questionText: data.questionText
    });
    
    // Store reference
    this.keyboardEntity = keyboard;
    
    // Add keyboard to scene
    document.querySelector('a-scene').appendChild(keyboard);
    
    // Wait for component to be ready
    const checkComponent = () => {
      if (keyboard.components['vr-keyboard']) {
        console.log('Keyboard component ready for', data.questionId);
        self.keyboardComponent = keyboard.components['vr-keyboard'];
      } else {
        setTimeout(checkComponent, 100);
      }
    };
    
    // Start checking after a brief delay
    setTimeout(checkComponent, 200);
    
    // Make the parent entity (the box) clickable
    const clickTarget = this.el.querySelector('.clickable') || this.el;
    
    clickTarget.addEventListener('click', () => {
      console.log('>>> RESPOND BUTTON CLICKED <<<', data.questionId);
      
      if (self.keyboardComponent) {
        console.log('Opening keyboard...');
        self.keyboardComponent.show();
      } else {
        console.warn('Keyboard not ready yet, trying again...');
        // Try to get it one more time
        if (keyboard.components['vr-keyboard']) {
          self.keyboardComponent = keyboard.components['vr-keyboard'];
          self.keyboardComponent.show();
        }
      }
    });
    
    // Also listen on the entity itself
    this.el.addEventListener('click', () => {
      if (self.keyboardComponent) {
        self.keyboardComponent.show();
      }
    });
  },
  
  remove: function() {
    // Clean up keyboard when component is removed
    if (this.keyboardEntity && this.keyboardEntity.parentNode) {
      this.keyboardEntity.parentNode.removeChild(this.keyboardEntity);
    }
  }
});

console.log('question-responder component registered');