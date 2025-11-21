// Math Worksheet Module

export const id = 'math';
export const name = 'Math Worksheet';

export const options = [
  {
    id: 'addition',
    label: 'Addition problems',
    min: 0,
    max: 25,
    defaultValue: 10
  },
  {
    id: 'subtraction',
    label: 'Subtraction problems',
    min: 0,
    max: 25,
    defaultValue: 10
  },
  {
    id: 'multiplication',
    label: 'Multiplication problems',
    min: 0,
    max: 25,
    defaultValue: 0
  },
  {
    id: 'comparison',
    label: 'Comparison problems',
    min: 0,
    max: 25,
    defaultValue: 0
  }
];

export function generate(params) {
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 54; // 0.75 inch margins
  const COLUMNS = 5;
  const FONT_SIZE = 22;
  const LINE_HEIGHT = 105; // Vertical spacing between problems

  // Generate all problems
  let allProblems = [];
  allProblems = allProblems.concat(generateProblems(params.addition, '+'));
  allProblems = allProblems.concat(generateProblems(params.subtraction, '-'));
  allProblems = allProblems.concat(generateProblems(params.multiplication, '×'));
  allProblems = allProblems.concat(generateComparisonProblems(params.comparison));

  // Shuffle them
  shuffleArray(allProblems);

  // Calculate layout
  const contentWidth = PAGE_WIDTH - (2 * MARGIN);
  const columnWidth = contentWidth / COLUMNS;

  let svgContent = '';
  let currentCol = 0;
  let currentRow = 0;

  // Draw each problem
  allProblems.forEach((problem) => {
    // Comparison problems take 2 columns
    const columnsNeeded = problem.operation === 'cmp' ? 2 : 1;

    // Check if we need to wrap to next row
    if (currentCol + columnsNeeded > COLUMNS) {
      currentCol = 0;
      currentRow++;
    }

    const leftEdge = MARGIN + (currentCol * columnWidth);
    const baseY = MARGIN + (currentRow * LINE_HEIGHT) + 55;

    if (problem.operation === 'cmp') {
      // Comparison problem: spans 2 columns
      const availableWidth = columnWidth * 2;
      const boxSize = 24;

      // Calculate widths
      const num1Str = problem.num1.toString();
      const num2Str = problem.num2.toString();
      const num1Width = num1Str.length * 13;
      const num2Width = num2Str.length * 13;
      const totalWidth = num1Width + boxSize + num2Width + 16;
      const startX = leftEdge + (availableWidth - totalWidth) / 2;

      svgContent += `
        <text x="${startX + num1Width}" y="${baseY}" text-anchor="end" font-size="${FONT_SIZE}" font-family="Arial, sans-serif">${num1Str}</text>
        <rect x="${startX + num1Width + 4}" y="${baseY - boxSize + 4}" width="${boxSize}" height="${boxSize}" fill="none" stroke="black" stroke-width="1.5"/>
        <text x="${startX + num1Width + boxSize + 8}" y="${baseY}" text-anchor="start" font-size="${FONT_SIZE}" font-family="Arial, sans-serif">${num2Str}</text>
      `;

      currentCol += 2;
    } else {
      // Arithmetic problem: vertical stacked format
      const num1Str = problem.num1.toString();
      const num2Str = problem.num2.toString();
      const maxDigits = Math.max(num1Str.length, num2Str.length);

      // Use fixed-width layout
      const digitWidth = 14;
      const problemWidth = (maxDigits + 1) * digitWidth + 10;
      const startX = leftEdge + (columnWidth - problemWidth) / 2;
      const rightEdge = startX + problemWidth;

      svgContent += `
        <text x="${rightEdge}" y="${baseY - 26}" text-anchor="end" font-size="${FONT_SIZE}" font-family="Courier, monospace">${num1Str}</text>
        <text x="${startX + 2}" y="${baseY}" text-anchor="start" font-size="${FONT_SIZE}" font-family="Arial, sans-serif">${problem.operation}</text>
        <text x="${rightEdge}" y="${baseY}" text-anchor="end" font-size="${FONT_SIZE}" font-family="Courier, monospace">${num2Str}</text>
        <line x1="${startX}" y1="${baseY + 3}" x2="${rightEdge}" y2="${baseY + 3}" stroke="black" stroke-width="1.5"/>
      `;

      currentCol += 1;
    }
  });

  return `<svg viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${svgContent}
  </svg>`;
}

// ============================================================================
// PROBLEM GENERATION
// ============================================================================

function generateProblems(count, operation) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    let num1, num2;
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        num2 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        break;
      case '-':
        num1 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        num2 = Math.floor(Math.random() * num1) + 1; // 1 to num1 (ensures positive result)
        break;
      case '×':
        num1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const maxFactor = Math.min(Math.floor(29 / num1), 12); // Ensure product < 30
        num2 = Math.floor(Math.random() * maxFactor) + 1;
        break;
    }
    problems.push({ num1, num2, operation });
  }
  return problems;
}

function generateComparisonProblems(count) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    const num1 = Math.floor(Math.random() * 10001); // 0 to 10,000
    const num2 = Math.floor(Math.random() * 10001); // 0 to 10,000
    problems.push({ num1, num2, operation: 'cmp' });
  }
  return problems;
}

function shuffleArray(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
