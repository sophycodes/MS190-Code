/**
 * question-responder.js - Connects RESPOND buttons to VR keyboard
 */

console.log('=== question-responder.js FILE LOADED ===');

/**
 * Question Responder Component - Opens VR keyboard when RESPOND button is clicked
 * Creates a keyboard instance for each question and handles button clicks
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
        this.keyboardComponent.show(this.el);
      } else {
        console.warn('Keyboard component not ready yet!');
      }
    });
  }
});

console.log('question-responder component registered');