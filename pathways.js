/**
 * pathways.js - Manages the three network pathways
 * TEXT (Red), AUDIO (Green), MOVEMENT (Blue)
 */

const Pathways = {
  currentPathway: null,
  userInputData: [],
  
  init: function() {
    console.log('Pathways initialized');
  },
  
  // TEXT PATHWAY - Users leave text notes
  textPathway: {
    notes: [],
    
    createNote: function(text, position) {
      const note = document.createElement('a-entity');
      
      // Create text element
      const textEl = document.createElement('a-text');
      textEl.setAttribute('value', text);
      textEl.setAttribute('color', '#FF0000');
      textEl.setAttribute('align', 'center');
      textEl.setAttribute('width', '3');
      textEl.setAttribute('wrap-count', '20');
      
      // Create background plane
      const bg = document.createElement('a-plane');
      bg.setAttribute('color', '#000000');
      bg.setAttribute('opacity', '0.7');
      bg.setAttribute('width', '2');
      bg.setAttribute('height', '1');
      
      note.appendChild(bg);
      note.appendChild(textEl);
      
      note.setAttribute('position', position);
      note.setAttribute('class', 'data-fragment positive');
      
      // Add floating animation
      note.setAttribute('animation', {
        property: 'position',
        to: `${position.x} ${position.y + 0.5} ${position.z}`,
        dir: 'alternate',
        loop: true,
        dur: 2000,
        easing: 'easeInOutSine'
      });
      
      this.notes.push(note);
      return note;
    },
    
    promptUserInput: function() {
      // In a real implementation, you'd use a VR keyboard or speech-to-text
      // For now, we'll simulate with predefined messages
      const sampleTexts = [
        'Hello World',
        'I am here',
        'Digital Self',
        'Data is power',
        'Lost in cyberspace'
      ];
      
      return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    }
  },
  
  // AUDIO PATHWAY - Users' voices are recorded
  audioPathway: {
    recordings: [],
    isRecording: false,
    
    startRecording: function() {
      console.log('Starting audio recording...');
      this.isRecording = true;
      
      // In real implementation, use Web Audio API to record
      // For prototype, we'll visualize audio as pulsing spheres
    },
    
    stopRecording: function() {
      console.log('Stopping audio recording...');
      this.isRecording = false;
      
      // Create audio visualization
      return this.createAudioVisualization();
    },
    
    createAudioVisualization: function(position) {
      const audioViz = document.createElement('a-entity');
      
      // Create multiple spheres for audio visualization
      for (let i = 0; i < 5; i++) {
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('radius', 0.1 + (i * 0.05));
        sphere.setAttribute('color', '#00FF00');
        sphere.setAttribute('opacity', 0.6 - (i * 0.1));
        
        sphere.setAttribute('animation', {
          property: 'scale',
          to: `${1.5 + i * 0.3} ${1.5 + i * 0.3} ${1.5 + i * 0.3}`,
          dir: 'alternate',
          loop: true,
          dur: 500 + (i * 200),
          easing: 'easeInOutSine'
        });
        
        audioViz.appendChild(sphere);
      }
      
      if (!position) {
        position = {
          x: Math.random() * 10 - 5,
          y: Math.random() * 5 + 1,
          z: Math.random() * -10 - 5
        };
      }
      
      audioViz.setAttribute('position', position);
      audioViz.setAttribute('class', 'data-fragment positive');
      
      this.recordings.push(audioViz);
      return audioViz;
    }
  },
  
  // MOVEMENT PATHWAY - User gestures create traces
  movementPathway: {
    traces: [],
    isTracking: false,
    lastPosition: null,
    
    startTracking: function() {
      console.log('Starting movement tracking...');
      this.isTracking = true;
      this.lastPosition = Player.getPosition();
    },
    
    stopTracking: function() {
      console.log('Stopping movement tracking...');
      this.isTracking = false;
    },
    
    createTrace: function(startPos, endPos) {
      const trace = document.createElement('a-entity');
      
      // Create a line/cylinder between two points
      const distance = this.calculateDistance(startPos, endPos);
      const midpoint = {
        x: (startPos.x + endPos.x) / 2,
        y: (startPos.y + endPos.y) / 2,
        z: (startPos.z + endPos.z) / 2
      };
      
      const cylinder = document.createElement('a-cylinder');
      cylinder.setAttribute('radius', '0.05');
      cylinder.setAttribute('height', distance);
      cylinder.setAttribute('color', '#0000FF');
      cylinder.setAttribute('opacity', '0.7');
      
      trace.appendChild(cylinder);
      trace.setAttribute('position', midpoint);
      trace.setAttribute('class', 'data-fragment positive');
      
      // Orient cylinder between points
      trace.setAttribute('look-at', endPos);
      
      // Fade out animation
      trace.setAttribute('animation', {
        property: 'opacity',
        to: '0',
        dur: 5000,
        delay: 2000
      });
      
      this.traces.push(trace);
      return trace;
    },
    
    calculateDistance: function(pos1, pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dz = pos2.z - pos1.z;
      return Math.sqrt(dx*dx + dy*dy + dz*dz);
    },
    
    update: function() {
      if (!this.isTracking) return;
      
      const currentPos = Player.getPosition();
      
      if (this.lastPosition) {
        const distance = this.calculateDistance(this.lastPosition, currentPos);
        
        // Only create trace if moved enough
        if (distance > 0.1) {
          const trace = this.createTrace(this.lastPosition, currentPos);
          
          // Add to scene
          const container = document.querySelector('#dataFragmentsContainer');
          container.appendChild(trace);
        }
      }
      
      this.lastPosition = currentPos;
    }
  },
  
  // Generate corrupted/negative data
  generateCorruptedData: function(pathwayType) {
    const container = document.querySelector('#dataFragmentsContainer');
    
    const position = {
      x: Math.random() * 20 - 10,
      y: Math.random() * 5 + 1,
      z: Math.random() * -15 - 5
    };
    
    let corruptedElement;
    
    switch(pathwayType) {
      case 'TEXT':
        corruptedElement = document.createElement('a-text');
        corruptedElement.setAttribute('value', '��ERROR��CORRUPTED��');
        corruptedElement.setAttribute('color', '#FF0000');
        corruptedElement.setAttribute('opacity', '0.8');
        corruptedElement.setAttribute('width', '4');
        break;
        
      case 'AUDIO':
        corruptedElement = document.createElement('a-sphere');
        corruptedElement.setAttribute('radius', '0.5');
        corruptedElement.setAttribute('color', '#FF0000');
        corruptedElement.setAttribute('opacity', '0.5');
        corruptedElement.setAttribute('animation', {
          property: 'scale',
          to: '2 2 2',
          dir: 'alternate',
          loop: true,
          dur: 300 // Aggressive pulsing
        });
        break;
        
      case 'MOVEMENT':
        corruptedElement = document.createElement('a-box');
        corruptedElement.setAttribute('width', '0.3');
        corruptedElement.setAttribute('height', '0.3');
        corruptedElement.setAttribute('depth', '0.3');
        corruptedElement.setAttribute('color', '#FF0000');
        corruptedElement.setAttribute('animation', {
          property: 'rotation',
          to: '360 360 360',
          loop: true,
          dur: 500 // Erratic spinning
        });
        break;
    }
    
    if (corruptedElement) {
      corruptedElement.setAttribute('position', position);
      corruptedElement.setAttribute('class', 'data-fragment negative');
      container.appendChild(corruptedElement);
    }
  }
};