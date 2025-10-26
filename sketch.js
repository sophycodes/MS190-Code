let streams = [];
let words = ['WHY', 'WHAT', 'WHO', 'HOW', 'WHEN', 'WHERE', 'WHICH', 'WHOSE', '??????', '????', '¿¿¿¿¿', '¿¿¿'];
const fadeInterval = 1.6;
const symbolSize = 14;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  background(0);
  let x = 0;
  for (let i = 0; i <= width / symbolSize; i++) {
    const stream = new Stream();
    stream.generateSymbols(x, random(-2000, 0));
    streams.push(stream);
    x += symbolSize;
  }
  textFont('Consolas');
  textSize(symbolSize);
}

function draw() {
  background(0, 150);
  streams.forEach((stream) => {
    stream.render();
  });
}

/**
 * MatrixSymbol - Represents a single character in the Matrix digital rain effect
 * 
 * Creates an animated symbol that falls down the screen, randomly switching between
 * words and their binary representations.
 */
class MatrixSymbol {
  
  /**
   * @param {number} x - The horizontal position of the symbol on the canvas
   * @param {number} y - The vertical position of the symbol on the canvas
   * @param {number} speed - How fast the symbol falls (pixels per frame)
   * @param {boolean} first - Whether this is the leading symbol in a stream (renders brighter)
   * @param {number} opacity - The transparency level of the symbol (0-255)
   */
  constructor(x, y, speed, first, opacity) {
    this.x = x;
    this.y = y;
    this.value = '';
    this.speed = speed;
    this.first = first;
    this.opacity = opacity;
    this.switchInterval = round(random(2, 25));
    this.showBinary = false; // Toggle between word and binary
    this.currentWord = ''; // Store the current word
    this.letterIndex = 0;  // Track which letter we're on
  }
  
  /**
   * Converts a string to its binary representation
   * @param {string} str - The string to convert
   * @returns {string} Binary representation
   */
  stringToBinary(str) {
    return str.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join(' ');
  }
  
  /**
   * Sets the symbol to letters from a word sequentially (W, H, O for "WHO")
   * Changes occur at intervals defined by switchInterval
   */
  setToRandomSymbol() {
    if (frameCount % this.switchInterval === 0) {
      
      
      // If we don't have a word yet, or we've reached the end, pick a new word
      if (this.currentWord === '' || this.letterIndex >= this.currentWord.length) {
        this.currentWord = words[floor(random(words.length))];
        this.letterIndex = 0; // Reset to first letter
      }
      
      // Get the current letter sequentially
      this.value = this.currentWord[this.letterIndex];
      
      // Move to next letter
      this.letterIndex++;
      

    }
  }
  
  /**
   * Animates the falling motion of the symbol
   * Resets to the top of the canvas when it reaches the bottom
   */
  rain() {
    this.y = (this.y >= height) ? 0 : this.y += this.speed;
  }
}

class Stream {
  
  constructor() {
    this.symbols = [];
    this.speed = random(5);
  }
  

  /**
   * Generates all symbols for this stream
   * @param {number} x - Horizontal position for the stream
   * @param {number} y - Starting vertical position
   */
  generateSymbols(x, y) {
    let opacity = 255;

    // Pick ONE word for this entire stream
    const streamWord = words[floor(random(words.length))];

    // Start from the LAST letter and work backwards
    for (let i = streamWord.length - 1; i >= 0; i--) {
      const first = (i === 0); // First letter (index 0) will be brightest
      const symbol = new MatrixSymbol(x, y, this.speed, first, opacity);
      symbol.value = streamWord[i]; // Assign letter in reverse order
      symbol.isFixed = true; // Mark as fixed so it doesn't change

      this.symbols.push(symbol);
      opacity -= (255 / streamWord.length) / fadeInterval; // Fade based on word length
      y -= symbolSize;
    }
  }
  
  /**
   * Renders all symbols in the stream and updates their state
   */
  render() {
    this.symbols.forEach((symbol) => {
      if (symbol.first) {
        fill(140, 255, 170, symbol.opacity);
      } else {
        fill(0, 255, 70, symbol.opacity);
      }

      text(symbol.value, symbol.x, symbol.y);
      symbol.rain();

      // Only change symbols that aren't fixed word letters
      if (!symbol.isFixed) {
        symbol.setToRandomSymbol();
      }
    });
  }
}



// make stream longer
// add switching effect from 101 


// stick some questions together 
// lett the characters switch from one question to another 
// 
