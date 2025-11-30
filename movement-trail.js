/**
 * movement-trail.js - Neon Ghost Trail Effect for Movement Realm
 * Creates flowing wireframe trails that follow user movement
 * Inspired by long-exposure light painting photography
 */

// ============================================
// TRAIL POINT - Individual point in the trail
// ============================================
class TrailPoint {
  constructor(position, timestamp) {
    this.position = position.clone();
    this.timestamp = timestamp;
    this.opacity = 1.0;
  }
}

// ============================================
// MOVEMENT TRAIL COMPONENT
// Attach to hands/controllers to leave trails
// ============================================
AFRAME.registerComponent('movement-trail', {
  schema: {
    color: { type: 'color', default: '#00ffff' },        // Neon cyan default
    secondaryColor: { type: 'color', default: '#ff00ff' }, // Magenta accent
    maxPoints: { type: 'int', default: 100 },            // Trail length
    fadeTime: { type: 'number', default: 3000 },         // ms before point fades
    lineWidth: { type: 'number', default: 0.02 },        // Thickness of trail
    minDistance: { type: 'number', default: 0.01 },      // Min distance to add point
    glowIntensity: { type: 'number', default: 1.5 },     // Glow strength
    wireframe: { type: 'boolean', default: true },       // Wireframe style
    ribbonMode: { type: 'boolean', default: false }      // Ribbon vs line
  },

  init: function() {
    this.points = [];
    this.lastPosition = new THREE.Vector3();
    this.trailMesh = null;
    this.trailGeometry = null;
    this.trailMaterial = null;
    
    // Get world position initially
    this.el.object3D.getWorldPosition(this.lastPosition);
    
    // Create the trail mesh
    this.createTrailMesh();
    
    // Add to scene (not as child, so it stays in world space)
    this.el.sceneEl.object3D.add(this.trailMesh);
    
    console.log('Movement trail initialized:', this.data.color);
  },

  createTrailMesh: function() {
    // Create geometry for the trail line
    this.trailGeometry = new THREE.BufferGeometry();
    
    // Pre-allocate buffer for max points
    const positions = new Float32Array(this.data.maxPoints * 3);
    const colors = new Float32Array(this.data.maxPoints * 3);
    const opacities = new Float32Array(this.data.maxPoints);
    
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    // Create glowing material
    const color = new THREE.Color(this.data.color);
    
    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        glowIntensity: { value: this.data.glowIntensity },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        varying vec3 vPosition;
        
        void main() {
          vOpacity = opacity;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float glowIntensity;
        uniform float time;
        varying float vOpacity;
        varying vec3 vPosition;
        
        void main() {
          // Base color with opacity fade
          vec3 glowColor = color * glowIntensity;
          
          // Add subtle pulse
          float pulse = 0.8 + 0.2 * sin(time * 2.0 + vPosition.y * 5.0);
          
          // Final color with glow
          gl_FragColor = vec4(glowColor * pulse, vOpacity * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create line mesh
    this.trailMesh = new THREE.Line(this.trailGeometry, this.trailMaterial);
    this.trailMesh.frustumCulled = false;
  },

  tick: function(time, deltaTime) {
    // Update shader time
    if (this.trailMaterial) {
      this.trailMaterial.uniforms.time.value = time * 0.001;
    }
    
    // Get current world position
    const currentPosition = new THREE.Vector3();
    this.el.object3D.getWorldPosition(currentPosition);
    
    // Check if moved enough to add new point
    const distance = currentPosition.distanceTo(this.lastPosition);
    
    if (distance > this.data.minDistance) {
      // Add new point
      this.points.unshift(new TrailPoint(currentPosition, time));
      this.lastPosition.copy(currentPosition);
      
      // Remove old points
      while (this.points.length > this.data.maxPoints) {
        this.points.pop();
      }
    }
    
    // Update point opacities and remove faded points
    const now = time;
    this.points = this.points.filter(point => {
      const age = now - point.timestamp;
      point.opacity = 1.0 - (age / this.data.fadeTime);
      return point.opacity > 0;
    });
    
    // Update geometry
    this.updateTrailGeometry();
  },

  updateTrailGeometry: function() {
    if (!this.trailGeometry || this.points.length < 2) return;
    
    const positions = this.trailGeometry.attributes.position.array;
    const opacities = this.trailGeometry.attributes.opacity.array;
    
    // Update positions and opacities
    for (let i = 0; i < this.data.maxPoints; i++) {
      if (i < this.points.length) {
        const point = this.points[i];
        positions[i * 3] = point.position.x;
        positions[i * 3 + 1] = point.position.y;
        positions[i * 3 + 2] = point.position.z;
        opacities[i] = point.opacity;
      } else {
        // Hide unused points
        opacities[i] = 0;
      }
    }
    
    // Mark for update
    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.opacity.needsUpdate = true;
    this.trailGeometry.setDrawRange(0, this.points.length);
  },

  remove: function() {
    if (this.trailMesh) {
      this.el.sceneEl.object3D.remove(this.trailMesh);
      this.trailGeometry.dispose();
      this.trailMaterial.dispose();
    }
  }
});


// ============================================
// RIBBON TRAIL COMPONENT
// Creates a ribbon/tube effect instead of lines
// More like the reference image's flowing forms
// ============================================
AFRAME.registerComponent('ribbon-trail', {
  schema: {
    color: { type: 'color', default: '#00ffff' },
    maxPoints: { type: 'int', default: 80 },
    fadeTime: { type: 'number', default: 2500 },
    width: { type: 'number', default: 0.08 },
    minDistance: { type: 'number', default: 0.015 },
    segments: { type: 'int', default: 8 }  // Ribbon segments for roundness
  },

  init: function() {
    this.points = [];
    this.lastPosition = new THREE.Vector3();
    this.ribbonMesh = null;
    
    this.el.object3D.getWorldPosition(this.lastPosition);
    this.createRibbonMesh();
    this.el.sceneEl.object3D.add(this.ribbonMesh);
  },

  createRibbonMesh: function() {
    // Create tube geometry that we'll update each frame
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -0.1)
    ]);
    
    this.ribbonGeometry = new THREE.TubeGeometry(curve, 2, this.data.width, this.data.segments, false);
    
    const color = new THREE.Color(this.data.color);
    
    this.ribbonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          // Fade along the ribbon length
          float fade = 1.0 - vUv.x;
          fade = pow(fade, 0.5); // Softer fade
          
          // Edge glow effect
          float edge = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float glow = 1.0 - edge;
          glow = pow(glow, 2.0) * 2.0;
          
          // Wireframe-like lines along the ribbon
          float lines = sin(vUv.x * 100.0 + time * 2.0) * 0.5 + 0.5;
          lines = step(0.9, lines) * 0.5;
          
          vec3 finalColor = color * (1.0 + glow + lines);
          
          gl_FragColor = vec4(finalColor, fade * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: false
    });
    
    this.ribbonMesh = new THREE.Mesh(this.ribbonGeometry, this.ribbonMaterial);
    this.ribbonMesh.frustumCulled = false;
  },

  tick: function(time, deltaTime) {
    this.ribbonMaterial.uniforms.time.value = time * 0.001;
    
    const currentPosition = new THREE.Vector3();
    this.el.object3D.getWorldPosition(currentPosition);
    
    const distance = currentPosition.distanceTo(this.lastPosition);
    
    if (distance > this.data.minDistance) {
      this.points.unshift({
        position: currentPosition.clone(),
        timestamp: time
      });
      this.lastPosition.copy(currentPosition);
      
      while (this.points.length > this.data.maxPoints) {
        this.points.pop();
      }
    }
    
    // Filter faded points
    const now = time;
    this.points = this.points.filter(p => (now - p.timestamp) < this.data.fadeTime);
    
    // Update ribbon geometry
    this.updateRibbon();
  },

  updateRibbon: function() {
    if (this.points.length < 4) return;
    
    // Create smooth curve through points
    const curvePoints = this.points.map(p => p.position);
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    
    // Recreate tube geometry
    const newGeometry = new THREE.TubeGeometry(
      curve, 
      Math.min(this.points.length * 2, 100), 
      this.data.width, 
      this.data.segments, 
      false
    );
    
    // Update mesh geometry
    this.ribbonMesh.geometry.dispose();
    this.ribbonMesh.geometry = newGeometry;
  },

  remove: function() {
    if (this.ribbonMesh) {
      this.el.sceneEl.object3D.remove(this.ribbonMesh);
      this.ribbonMesh.geometry.dispose();
      this.ribbonMaterial.dispose();
    }
  }
});


// ============================================
// GHOST SILHOUETTE COMPONENT
// Creates periodic "ghost" snapshots of pose
// Like the figure outlines in the reference
// ============================================
AFRAME.registerComponent('ghost-silhouette', {
  schema: {
    color: { type: 'color', default: '#00ffff' },
    interval: { type: 'number', default: 500 },  // ms between ghosts
    fadeTime: { type: 'number', default: 3000 }, // ms to fully fade
    maxGhosts: { type: 'int', default: 10 }
  },

  init: function() {
    this.ghosts = [];
    this.lastGhostTime = 0;
    this.ghostContainer = document.createElement('a-entity');
    this.ghostContainer.setAttribute('id', 'ghost-container');
    this.el.sceneEl.appendChild(this.ghostContainer);
  },

  tick: function(time, deltaTime) {
    // Create new ghost at interval
    if (time - this.lastGhostTime > this.data.interval) {
      this.createGhost(time);
      this.lastGhostTime = time;
    }
    
    // Update and fade existing ghosts
    this.ghosts = this.ghosts.filter(ghost => {
      const age = time - ghost.timestamp;
      const opacity = 1.0 - (age / this.data.fadeTime);
      
      if (opacity <= 0) {
        ghost.el.parentNode.removeChild(ghost.el);
        return false;
      }
      
      ghost.el.setAttribute('material', 'opacity', opacity * 0.5);
      return true;
    });
  },

  createGhost: function(time) {
    if (this.ghosts.length >= this.data.maxGhosts) {
      const oldest = this.ghosts.shift();
      oldest.el.parentNode.removeChild(oldest.el);
    }
    
    // Get current position
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    this.el.object3D.getWorldPosition(worldPos);
    this.el.object3D.getWorldQuaternion(worldQuat);
    
    // Create ghost entity
    const ghost = document.createElement('a-entity');
    ghost.setAttribute('position', worldPos);
    ghost.setAttribute('rotation', {
      x: THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(worldQuat).x),
      y: THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(worldQuat).y),
      z: THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(worldQuat).z)
    });
    
    // Simple wireframe sphere as ghost marker
    ghost.setAttribute('geometry', {
      primitive: 'icosahedron',
      radius: 0.1,
      detail: 1
    });
    ghost.setAttribute('material', {
      color: this.data.color,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      blending: 'additive'
    });
    
    this.ghostContainer.appendChild(ghost);
    this.ghosts.push({ el: ghost, timestamp: time });
  },

  remove: function() {
    this.ghosts.forEach(ghost => {
      if (ghost.el.parentNode) {
        ghost.el.parentNode.removeChild(ghost.el);
      }
    });
    if (this.ghostContainer.parentNode) {
      this.ghostContainer.parentNode.removeChild(this.ghostContainer);
    }
  }
});


// ============================================
// BODY TRAIL SYSTEM
// Full body tracking with multiple trail points
// ============================================
AFRAME.registerComponent('body-trail-system', {
  schema: {
    enabled: { type: 'boolean', default: true },
    leftHandColor: { type: 'color', default: '#00ffff' },
    rightHandColor: { type: 'color', default: '#ff00ff' },
    headColor: { type: 'color', default: '#ffffff' }
  },

  init: function() {
    // Wait for scene to be fully loaded
    this.el.sceneEl.addEventListener('loaded', () => {
      this.setupTrails();
    });
  },

  setupTrails: function() {
    // Find or create tracking points
    const leftHand = document.querySelector('#leftHand, [hand-controls="hand: left"]');
    const rightHand = document.querySelector('#rightHand, [hand-controls="hand: right"]');
    const camera = document.querySelector('[camera]');
    
    // Add trail components to hands
    if (leftHand && !leftHand.hasAttribute('ribbon-trail')) {
      leftHand.setAttribute('ribbon-trail', {
        color: this.data.leftHandColor,
        maxPoints: 60,
        fadeTime: 2000,
        width: 0.05
      });
      leftHand.setAttribute('ghost-silhouette', {
        color: this.data.leftHandColor,
        interval: 300,
        fadeTime: 2000
      });
    }
    
    if (rightHand && !rightHand.hasAttribute('ribbon-trail')) {
      rightHand.setAttribute('ribbon-trail', {
        color: this.data.rightHandColor,
        maxPoints: 60,
        fadeTime: 2000,
        width: 0.05
      });
      rightHand.setAttribute('ghost-silhouette', {
        color: this.data.rightHandColor,
        interval: 300,
        fadeTime: 2000
      });
    }
    
    // Optionally add subtle head trail
    if (camera && !camera.hasAttribute('movement-trail')) {
      camera.setAttribute('movement-trail', {
        color: this.data.headColor,
        maxPoints: 30,
        fadeTime: 1500
      });
    }
    
    console.log('Body trail system initialized');
  }
});