// Word Search Module

export const id = 'wordsearch';
export const name = 'Word Search';

export const options = [
  {
    id: 'gridSize',
    label: 'Grid size',
    type: 'range',
    min: 10,
    max: 25,
    defaultValue: 15
  },
  {
    id: 'wordList',
    label: 'Word list',
    type: 'select',
    choices: [
      { value: 'words-food.txt', label: 'Food' },
      { value: 'words-thanksgiving.txt', label: 'Thanksgiving' },
      { value: 'words-christmas.txt', label: 'Christmas' },
      { value: 'words-wingfeather.txt', label: 'Wingfeather' },
      { value: 'words-winter.txt', label: 'Winter' },
    ],
    defaultValue: 'words-food.txt'
  }
];

export function generate(params) {
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 54; // 0.75 inch margins
  const gridSize = params.gridSize;
  const wordListFile = params.wordList;

  // Calculate word count based on grid size (reasonable density)
  // Use approximately 0.8-1.0 words per unit of grid size
  const wordCount = Math.floor(gridSize * 0.85);

  // Fetch words and generate puzzle
  return fetchWordsAndGenerate(wordListFile, gridSize, wordCount, PAGE_WIDTH, PAGE_HEIGHT, MARGIN);
}

async function fetchWordsAndGenerate(wordListFile, gridSize, wordCount, pageWidth, pageHeight, margin) {
  try {
    const response = await fetch(`./data/${wordListFile}`);
    const text = await response.text();
    const allWords = text.split('\n')
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0 && w.length <= gridSize);

    if (allWords.length === 0) {
      return generateErrorSVG('No words found in word list', pageWidth, pageHeight);
    }

    // Shuffle and select words
    shuffleArray(allWords);
    const selectedWords = allWords.slice(0, Math.min(wordCount, allWords.length));

    // Generate grid
    const grid = createEmptyGrid(gridSize);
    const placedWords = [];

    // Try to place each word
    for (const word of selectedWords) {
      const placement = placeWord(grid, word);
      if (placement) {
        placedWords.push({ word, ...placement });
      }
    }

    // Fill remaining cells with random letters
    fillEmptySpaces(grid);

    // Render to SVG
    return renderWordSearchSVG(grid, placedWords, pageWidth, pageHeight, margin);

  } catch (error) {
    console.error('Error fetching words:', error);
    return generateErrorSVG('Failed to load word list', pageWidth, pageHeight);
  }
}

// ============================================================================
// GRID CREATION AND MANIPULATION
// ============================================================================

function createEmptyGrid(size) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    grid.push(new Array(size).fill(null));
  }
  return grid;
}

function fillEmptySpaces(grid) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === null) {
        grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
}

// ============================================================================
// WORD PLACEMENT
// ============================================================================

const DIRECTIONS = [
  { dx: 1, dy: 0, name: 'horizontal' },      // right
  { dx: 0, dy: 1, name: 'vertical' },        // down
  { dx: 1, dy: 1, name: 'diagonal-down' },   // diagonal down-right
  { dx: 1, dy: -1, name: 'diagonal-up' },    // diagonal up-right
  { dx: -1, dy: 0, name: 'horizontal-back' }, // left
  { dx: 0, dy: -1, name: 'vertical-up' },    // up
  { dx: -1, dy: -1, name: 'diagonal-up-back' }, // diagonal up-left
  { dx: -1, dy: 1, name: 'diagonal-down-back' } // diagonal down-left
];

function placeWord(grid, word) {
  const size = grid.length;
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Random starting position and direction
    const startX = Math.floor(Math.random() * size);
    const startY = Math.floor(Math.random() * size);
    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

    // Check if word fits
    if (canPlaceWord(grid, word, startX, startY, direction)) {
      // Place the word
      for (let i = 0; i < word.length; i++) {
        const x = startX + (i * direction.dx);
        const y = startY + (i * direction.dy);
        grid[y][x] = word[i];
      }
      return { startX, startY, direction: direction.name };
    }
  }

  return null; // Failed to place word
}

function canPlaceWord(grid, word, startX, startY, direction) {
  const size = grid.length;

  for (let i = 0; i < word.length; i++) {
    const x = startX + (i * direction.dx);
    const y = startY + (i * direction.dy);

    // Check bounds
    if (x < 0 || x >= size || y < 0 || y >= size) {
      return false;
    }

    // Check if cell is empty or has the same letter
    if (grid[y][x] !== null && grid[y][x] !== word[i]) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// SVG RENDERING
// ============================================================================

function renderWordSearchSVG(grid, placedWords, pageWidth, pageHeight, margin) {
  const size = grid.length;
  const availableWidth = pageWidth - (2 * margin);
  const availableHeight = pageHeight - (2 * margin);

  // Reserve space for word list at bottom (approximately 1/4 of page)
  const gridAreaHeight = availableHeight * 0.7;
  const wordListAreaHeight = availableHeight * 0.3;

  // Calculate cell size
  const cellSize = Math.min(
    availableWidth / size,
    gridAreaHeight / size
  );

  const gridWidth = cellSize * size;
  const gridHeight = cellSize * size;
  const gridStartX = margin + (availableWidth - gridWidth) / 2;
  const gridStartY = margin;

  const fontSize = cellSize * 0.6;

  let svgContent = '';

  // Draw letters
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const letter = grid[y][x];
      const xPos = gridStartX + (x * cellSize) + (cellSize / 2);
      const yPos = gridStartY + (y * cellSize) + (cellSize / 2) + (fontSize * 0.35);
      svgContent += `<text x="${xPos}" y="${yPos}" text-anchor="middle" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold">${letter}</text>`;
    }
  }

  // Draw word list
  const wordListStartY = gridStartY + gridHeight + 30;
  const wordListFontSize = 14;
  const wordsPerColumn = Math.ceil(placedWords.length / 3);
  const columnWidth = availableWidth / 3;

  placedWords.sort((a, b) => a.word.localeCompare(b.word));

  placedWords.forEach((item, index) => {
    const column = Math.floor(index / wordsPerColumn);
    const row = index % wordsPerColumn;
    const xPos = margin + (column * columnWidth);
    const yPos = wordListStartY + (row * wordListFontSize * 1.5);

    // Format word with proper capitalization
    const displayWord = item.word.charAt(0).toUpperCase() +
                       item.word.slice(1).toLowerCase();

    svgContent += `<text x="${xPos}" y="${yPos}" font-size="${wordListFontSize}" font-family="Arial, sans-serif">${displayWord}</text>`;
  });

  return `<svg viewBox="0 0 ${pageWidth} ${pageHeight}" xmlns="http://www.w3.org/2000/svg">
    ${svgContent}
  </svg>`;
}

function generateErrorSVG(message, pageWidth, pageHeight) {
  return `<svg viewBox="0 0 ${pageWidth} ${pageHeight}" xmlns="http://www.w3.org/2000/svg">
    <text x="${pageWidth / 2}" y="${pageHeight / 2}" text-anchor="middle" font-size="16" font-family="Arial, sans-serif">Error: ${message}</text>
  </svg>`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function shuffleArray(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
