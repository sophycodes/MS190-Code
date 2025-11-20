/**
 * grid-floor.js - Creates cyberpunk grid floor aesthetic
 */

console.log('=== grid-floor.js FILE LOADED ===');

/**
 * Grid Floor Component - creates cyberpunk grid aesthetic using THREE.js GridHelper
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