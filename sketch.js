let streams = [];
let words = ['WHY', 'WHAT', 'WHO', 'HOW', 'WHEN', 'WHERE', 'WHICH', 'WHOSE', '??????', '????', '¿¿¿¿¿', '¿¿¿'];
const fadeInterval = 1.6;
const symbolSize = 24;

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
 * words and their binary numbers (0,1).
 * 
 * @author Sophy Figaroa
 */
class MatrixSymbol {
  
  /**
   * @param {number} x - The horizontal position of the symbol on the canvas
   * @param {number} y - The vertical position of the symbol on the canvas
   * @param {number} speed - How fast the symbol falls (pixels per frame)
   * @param {boolean} first - Whether this is the leading symbol in a stream (renders brighter)
   * @param {number} opacity - The transparency level of the symbol (0-255)
   * @param {string} initialLetter - The original letter this symbol represents
   */
  constructor(x, y, speed, first, opacity, letter) {
    this.x = x;
    this.y = y;
    this.initialLetter = letter; // Store the original letter
    this.value = letter;  // Current display value (can be letter or 0/1)
    this.speed = speed;
    this.first = first;
    this.opacity = opacity;
    this.switchInterval = round(random(60,65)); // How often to switch
    this.showBinary = false; // Currently showing binary?
  }
  
  /**
   * Randomly switches between showing the letter and binary (0 or 1)
   */
  switchToBinary() {
    if (frameCount % this.switchInterval === 0) {
      this.showBinary = !this.showBinary; // Toggle
      
      if (this.showBinary) {
        // Show random binary digit
        this.value = floor(random(2)).toString(); // "0" or "1"
      } else {
        // Show original letter
        this.value = this.initialLetter;
      }
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


/**
 * Stream - Represents one vertical column of falling symbols forming a word (like "WHO" falling together)
 * 
 * @author Sophy Figaroa
 */
class Stream {
  
  constructor() {
    this.symbols = [];
    this.speed = random(5);
  }
  

  // Single Word Stream
  // /**
  //  * Generates all symbols for this stream
  //  * @param {number} x - Horizontal position for the stream
  //  * @param {number} y - Starting vertical position
  //  */
  // generateSymbols(x, y) {
  //   let opacity = 255;

  //   // Pick ONE word for this entire stream
  //   const streamWord = words[floor(random(words.length))];

  //   // Start from the LAST letter and work backwards
  //   for (let i = streamWord.length - 1; i >= 0; i--) {
  //     const first = (i === 0); // First letter (index 0) will be brightest
  //     const letter = streamWord[i];
  //     const symbol = new MatrixSymbol(x, y, this.speed, first, opacity, letter);

  //     this.symbols.push(symbol);
  //     opacity -= (255 / streamWord.length) / fadeInterval; // Fade based on word length
  //     y -= symbolSize;
  //   }
  // }


  // // Multi Word Stream
  // /**
  // * Generates all symbols for this stream
  // * @param {number} x - Horizontal position for the stream
  // * @param {number} y - Starting vertical position
  // */
  // generateSymbols(x, y) {
  //   let opacity = 255;

  //   // Pick random number of words to stack (1-3 words)
  //   const numWords = floor(random(1, 4)); // 1, 2, or 3 words
  //   let allLetters = []; // Store all letters from all words

  //   // Combine multiple words
  //   for (let w = 0; w < numWords; w++) {
  //     const word = words[floor(random(words.length))];
  //     // Split word into individual letters and add to array
  //     allLetters = allLetters.concat(word.split(''));
      
  //   }

  //   // Start from the LAST letter and work backwards
  //   for (let i = allLetters.length - 1; i >= 0; i--) {
  //     const first = (i === 0); // First letter (index 0) will be brightest
  //     const letter = allLetters[i];
  //     const symbol = new MatrixSymbol(x, y, this.speed, first, opacity, letter);

  //     this.symbols.push(symbol);
  //     opacity -= (255 / allLetters.length) / fadeInterval; // Fade based on total length
  //     y -= symbolSize;
  //   }
  // }

  generateSymbols(x, y) {
    const numWords = floor(random(1, 4));
    let allLetters = [];

    for (let w = 0; w < numWords; w++) {
      const word = words[floor(random(words.length))];
      allLetters = allLetters.concat(word.split(''));

    }

    // Loop FORWARD and place first letter at top
    for (let i = 0; i < allLetters.length; i++) {
      const letter = allLetters[i];
      const isLast = (i === allLetters.length - 1); // Last letter = brightest
      
      // Opacity increases toward the end (brightest at bottom)
      const opacity = 255 * ((i + 1) / allLetters.length);
      
      const symbol = new MatrixSymbol(x, y + (i * symbolSize), this.speed, isLast, opacity, letter);
      this.symbols.push(symbol);
    }
  }

  /**
   * Renders all symbols in the stream and updates their state
   */
  render() {
    this.symbols.forEach((symbol) => {
      // Color based on what's being displayed
      if (symbol.first) {
        fill(140, 255, 170, symbol.opacity); // Bright green for first
      } else if (symbol.showBinary) {
        fill(0, 255, 70, symbol.opacity); // Blue for binary
      } else {
        fill(0, 255, 70, symbol.opacity); // Green for letters
      }

      text(symbol.value, symbol.x, symbol.y);
      symbol.rain();

      symbol.switchToBinary(); // Always try to switch

    });
  }
}



// stick some questions together 
// lett the characters switch from one question to another 
// 
