/**
 * portal-button.js - Makes entities clickable to switch between scenes
 */

console.log('=== portal-button.js FILE LOADED ===');

/**
 * Portal Button Component - makes entities clickable to switch scenes
 * Adds click handlers and hover effects for scene navigation
 */
AFRAME.registerComponent('portal-button', {
  schema: {
    target: {type: 'string', default: 'text'},
    fadeTransition: {type: 'boolean', default: false},
    fadeDuration: {type: 'number', default: 500}
  },
  
  init: function() {
    console.log('>>> PORTAL BUTTON INIT <<<', this.el.id, 'target:', this.data.target);
    const data = this.data;
    
    // Find the clickable child (could be this element or a box child)
    const clickableBox = this.el.querySelector('a-box') || this.el.querySelector('.clickable') || this.el;
    clickableBox.classList.add('clickable');
    
    this.onClick = () => {
      console.log('>>> PORTAL CLICKED <<<', data.target);
      
      // Get the player entity
      const player = document.querySelector('#player');
      
      if (!player) {
        console.warn('Player not found');
        return;
      }
      
      // Get current position
      const currentPos = player.getAttribute('position');
      
      // Animate player forward 10 units
      player.setAttribute('animation', {
        property: 'position',
        to: `${currentPos.x} ${currentPos.y} ${currentPos.z - 10}`,  // Move forward (negative Z)
        dur: 1000,  // 1 second
        easing: 'easeInQuad'
      });
      
      // Switch scene after animation completes
      setTimeout(() => {
        const sceneManager = document.querySelector('[scene-manager]');
        
        if (sceneManager && sceneManager.components['scene-manager']) {
          sceneManager.components['scene-manager'].switchScene(data.target);
        } else {
          console.warn('Scene manager not found');
        }
      }, 1000);  // Wait for animation to finish
    };
    
    clickableBox.addEventListener('click', this.onClick);
    this.clickableBox = clickableBox; // Store reference for cleanup
    
    // Add hover effect
    this.onMouseEnter = () => {
      console.log('>>> PORTAL HOVER <<<', this.el.id);
      this.el.setAttribute('scale', '1.1 1.1 1.1');
    };
    
    this.onMouseLeave = () => {
      this.el.setAttribute('scale', '1 1 1');
    };
    
    clickableBox.addEventListener('mouseenter', this.onMouseEnter);
    clickableBox.addEventListener('mouseleave', this.onMouseLeave);
  },
  
  remove: function() {
    if (this.clickableBox) {
      this.clickableBox.removeEventListener('click', this.onClick);
      this.clickableBox.removeEventListener('mouseenter', this.onMouseEnter);
      this.clickableBox.removeEventListener('mouseleave', this.onMouseLeave);
    }
  }
});

console.log('portal-button component registered');