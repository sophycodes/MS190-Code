let streams = [];
let words = ['WHY', 'WHAT', 'WHO', 'HOW', 'WHEN', 'WHERE', 'WHICH', 'WHOSE', '??????', '????', '¿¿¿¿¿', '¿¿¿'];
let userWords = []; // store user input for stream
const fadeInterval = 1.6;
const symbolSize = 24;

let inputBox; // The input field
let submitButton; // The submit button

// ============== SUPABASE CONFIG ==============
const SUPABASE_URL = 'https://lhbfbvdjpgrihsibymkw.supabase.co';  
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoYmZidmRqcGdyaWhzaWJ5bWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTU5MTksImV4cCI6MjA3OTUzMTkxOX0.zNQ63iaifP-iLjGwwdzfZSd6ks_6w2aAf5YUFl5R-Zo';  // Replace with your anon key

// ============== LOAD SECRETS FROM DATABASE ==============
async function loadSecrets() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/secrets?select=text`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const data = await response.json();
    
    // Add all saved secrets to userWords
    data.forEach(secret => {
      userWords.push(secret.text.toUpperCase());
    });
    
    console.log('Loaded secrets from database:', userWords);
    
    // Create initial blue streams for loaded secrets
    if (userWords.length > 0) {
      for (let i = 0; i < min(userWords.length, 10); i++) {
        const x = random(0, width);
        const stream = new Stream(true);
        stream.generateSymbols(x, random(-2000, 0));
        streams.push(stream);
      }
    }
  } catch (error) {
    console.error('Error loading secrets:', error);
  }
}

// ============== SAVE SECRET TO DATABASE ==============
async function saveSecret(text) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/secrets`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ text: text })
    });
    console.log('Secret saved:', text);
  } catch (error) {
    console.error('Error saving secret:', error);
  }
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  background(0);

  let inputBoxW = 300;
  let inputBoxH = 40;
  let buttonW = 100;
  let buttonH = 40;


  // Create input box
  inputBox = createInput('');
  inputBox.size(inputBoxW, inputBoxH);
  inputBox.center('horizontal'); // Center horizontally only
  inputBox.position(inputBox.x, height / 2 - 50); // Set vertical position
  inputBox.style('font-size', '20px');
  inputBox.style('padding', '10px');
  inputBox.style('background-color', '#000000');
  inputBox.style('color', '#00ff00');
  inputBox.style('border', '2px solid #00ff00');
  inputBox.attribute('placeholder', 'Enter password...');
  
  // Create submit button
  submitButton = createButton('SUBMIT');
  submitButton.size(buttonW, buttonH);
  submitButton.center('horizontal'); // Center horizontally only
  submitButton.position(submitButton.x + 7, inputBox.y + inputBoxH + 40); // 20px below input
  submitButton.size(100, 40);
  submitButton.style('font-size', '16px');
  submitButton.style('background-color', '#00ff00');
  submitButton.style('color', '#000000');
  submitButton.style('border', 'none');
  submitButton.style('cursor', 'pointer');
  submitButton.mousePressed(handleSubmit); // Call function when clicked


  // generate initial stream of questions
  let x = 0;
  for (let i = 0; i <= width / symbolSize; i++) {
    const stream = new Stream();
    stream.generateSymbols(x, random(-2000, 0));
    streams.push(stream);
    x += symbolSize;
  }
  textFont('Consolas');
  textSize(symbolSize);

  loadSecrets();

}

function draw() {
  background(0, 150);

  // Draw "Enter password" text above input
  fill(0, 255, 70); // Green color
  textSize(20);
  textAlign(CENTER);
  text("WHAT'S YOUR BEST KEPT SECRET?", (width / 2) + 8, height / 2 - 80);
  
  // Reset text settings for streams
  textSize(symbolSize);
  textAlign(LEFT);

  streams.forEach((stream) => {
    stream.render();
  });
}

function handleSubmit() {
  let userInput = inputBox.value().trim(); // Get input and remove extra spaces
  
  if (userInput !== '') {
    // Add to userWords array
    userWords.push(userInput.toUpperCase()); // Store in uppercase
    saveSecret(userInput.toUpperCase());// save to database

    // Create a new stream with this word (blue color)
    const x = random(0, width); // Random horizontal position
    const stream = new Stream(true); // Pass true to indicate it's a user stream
    stream.generateSymbols(x, random(-2000, 0));
    streams.push(stream);
    
    // Clear the input
    inputBox.value('');
    
    console.log('User words:', userWords); // Debug
  }
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
  
  constructor(isUserStream = false) {  // ADD the parameter here!
    this.symbols = [];
    this.speed = random(5);
    this.isUserStream = isUserStream; // FIXED: was "his.isUserStream"
  }
  
  generateSymbols(x, y) {
    const numWords = floor(random(1, 4));
    let allLetters = [];

    // Choose words based on stream type
    if (this.isUserStream && userWords.length > 0) {
      // Use user-submitted words
      const wordsToUse = min(numWords, userWords.length);
      
      for (let w = 0; w < wordsToUse; w++) {
        const randomIndex = floor(random(userWords.length));
        const word = userWords[randomIndex];
        allLetters = allLetters.concat(word.split(''));
      }
    } else {
      // Use default words array
      for (let w = 0; w < numWords; w++) {
        const word = words[floor(random(words.length))];
        allLetters = allLetters.concat(word.split(''));
      }
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
        // Leading character (brightest)
        if (this.isUserStream) {
          fill(100, 200, 255, symbol.opacity); // Light blue for user stream
        } else {
          fill(255, 255, 255, symbol.opacity); // White for question stream
        }
      } else if (symbol.showBinary) {
        // Binary numbers match stream color
        if (this.isUserStream) {
          fill(0, 150, 255, symbol.opacity); // Blue binary for user stream
        } else {
          fill(0, 255, 70, symbol.opacity); // Green binary for question stream
        }
      } else {
        // Regular letters
        if (this.isUserStream) {
          fill(0, 150, 255, symbol.opacity); // Blue letters for user stream
        } else {
          fill(0, 255, 70, symbol.opacity); // Green letters for question stream
        }
      }

      text(symbol.value, symbol.x, symbol.y);
      symbol.rain();
      symbol.switchToBinary(); // Always try to switch
    });
  }
}




// lett the characters switch from one question to another
// add user input 
// add sound


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