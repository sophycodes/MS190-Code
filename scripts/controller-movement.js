AFRAME.registerComponent('controller-movement', {
  schema: {
    speed: {default: 2.5}
  },
  
  init: function() {
    this.direction = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.thumbstickX = 0;
    this.thumbstickY = 0;
    
    // Listen for thumbstick events
    this.el.addEventListener('thumbstickmoved', (evt) => {
      this.thumbstickX = evt.detail.x;
      this.thumbstickY = evt.detail.y;
    });
  },
  
  tick: function(time, delta) {
    const x = this.thumbstickX;
    const y = this.thumbstickY;
    
    // Dead zone to prevent drift
    const deadZone = 0.15;
    if (Math.abs(x) > deadZone || Math.abs(y) > deadZone) {
      
      const player = document.querySelector('#player');
      const camera = player.querySelector('[camera]');
      
      if (!player || !camera) return;
      
      // Get camera's forward direction
      camera.object3D.getWorldDirection(this.direction);
      this.direction.y = 0; // Keep movement horizontal only
      this.direction.normalize();
      
      // Calculate forward/backward movement
      const forward = this.direction.clone().multiplyScalar(-y);
      
      // Calculate left/right strafing
      const right = new THREE.Vector3();
      right.crossVectors(this.direction, new THREE.Vector3(0, 1, 0));
      const strafe = right.multiplyScalar(x);
      
      // Combine movements
      const movement = forward.add(strafe).multiplyScalar(this.data.speed * delta / 1000);
      
      // Apply movement to player
      player.object3D.position.add(movement);
    }
  }
});