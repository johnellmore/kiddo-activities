// Comic Book Frames Module

export const id = 'comic';
export const name = 'Comic Book Frames';

export const options = [
  {
    id: 'rows',
    label: 'Rows per page',
    min: 2,
    max: 5,
    defaultValue: 3
  }
];

export function generate(params) {
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const PAGE_INNER_MARGIN = 0.03;
  const PAGE_OUTER_MARGIN = 0.08;
  const STROKE_WIDTH = 0.005;

  // Generate random template
  const rows = [];
  for (let i = 0; i < params.rows; i++) {
    rows.push(generateRandomPageRow());
  }
  const template = rows.join("\n");

  // Parse template
  const pageRows = parseTemplate(template);
  const page = new Page(pageRows, PAGE_INNER_MARGIN, PAGE_OUTER_MARGIN);

  // Generate frames
  const frames = pageToFrames(page, [PAGE_WIDTH, PAGE_HEIGHT]);

  // Render to SVG path
  const pathData = renderFramesToSVG(frames, PAGE_WIDTH, PAGE_HEIGHT);

  return `<svg viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathData}" fill="none" stroke="black" stroke-width="${STROKE_WIDTH * PAGE_WIDTH}" stroke-linejoin="miter"/>
  </svg>`;
}

// ============================================================================
// COMIC FRAME GENERATION
// ============================================================================

const SEPARATORS = ['/', '|', '\\', '>', '<'];

class Page {
  constructor(rows, innerMargin, outerMargin) {
    this.rows = rows;
    this.innerMargin = innerMargin;
    this.outerMargin = outerMargin;
  }
}

class PageRow {
  constructor(panels) {
    this.panels = panels;
  }

  get totalWidth() {
    return this.panels.reduce((sum, panel) => sum + panel.width, 0);
  }
}

class Panel {
  constructor(width, leftBorderType, rightBorderType) {
    this.width = width;
    this.leftBorderType = leftBorderType;
    this.rightBorderType = rightBorderType;
  }
}

class Edger {
  constructor(x, yMin, yMax, gutter) {
    this.x = x;
    this.yMin = yMin;
    this.yMax = yMax;
    this.gutter = gutter;
  }

  for(char) {
    if (char === '|') return this.straight();
    else if (char === '/') return this.forwardDiag();
    else if (char === '\\') return this.backwardDiag();
    else if (char === '>') return this.rightAngle();
    else if (char === '<') return this.leftAngle();
    throw new Error('Invalid separator type');
  }

  straight() {
    return [[this.x, this.yMin], [this.x, this.yMax]];
  }

  forwardDiag() {
    return [
      [this.x + this.gutter, this.yMin],
      [this.x - this.gutter, this.yMax],
    ];
  }

  backwardDiag() {
    return [
      [this.x - this.gutter, this.yMin],
      [this.x + this.gutter, this.yMax],
    ];
  }

  rightAngle() {
    return [
      [this.x - this.gutter / 2, this.yMin],
      [this.x + this.gutter / 2, (this.yMax - this.yMin) / 2 + this.yMin],
      [this.x - this.gutter / 2, this.yMax],
    ];
  }

  leftAngle() {
    return [
      [this.x + this.gutter / 2, this.yMin],
      [this.x - this.gutter / 2, (this.yMax - this.yMin) / 2 + this.yMin],
      [this.x + this.gutter / 2, this.yMax],
    ];
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomPageRow() {
  const rowWidths = [
    [1],
    [1, 1],
    [1, 2],
    [2, 1],
    [1, 1, 1],
  ];
  const thisRowWidth = pickRandom(rowWidths).slice(); // copy array

  let row = '' + thisRowWidth.shift();
  for (const width of thisRowWidth) {
    const sep = pickRandom(SEPARATORS);
    row += sep + width;
  }
  return row;
}

function parseTemplate(tmpl) {
  return tmpl.split("\n").map(rowTmpl => {
    const chars = (rowTmpl + '|').split('');
    let lastBorderType = '|';
    let lastPanelWidth = null;
    const panels = [];

    for (const ch of chars) {
      if (!isNaN(+ch)) { // if is numeric
        lastPanelWidth = +ch;
      } else if (SEPARATORS.includes(ch)) {
        panels.push(new Panel(lastPanelWidth, lastBorderType, ch));
        lastPanelWidth = null;
        lastBorderType = ch;
      }
    }
    return new PageRow(panels);
  });
}

function pageToFrames(page, pageSizeWH) {
  const [wPx, hPx] = pageSizeWH;
  const outerMarginPx = page.outerMargin * wPx;
  const innerMarginPx = page.innerMargin * wPx;
  const offsetXPx = outerMarginPx;
  const panelHeight = (hPx - (2 * outerMarginPx) - ((page.rows.length - 1) * innerMarginPx)) / page.rows.length;

  const frames = page.rows.flatMap((row, i) => {
    const offsetYPx = outerMarginPx + (i * (panelHeight + innerMarginPx));
    const availablePanelWidth = wPx - (2 * outerMarginPx) - ((row.panels.length - 1) * innerMarginPx);
    let rowOffsetXPx = offsetXPx;

    const rowFrames = row.panels.map(panel => {
      const [x, y] = [rowOffsetXPx, offsetYPx];
      const panelWidth = availablePanelWidth / row.totalWidth * panel.width;
      const leftEdge = new Edger(x, y, y + panelHeight, innerMarginPx);
      const rightEdge = new Edger(x + panelWidth, y, y + panelHeight, innerMarginPx);
      const frame = [
        ...(leftEdge.for(panel.leftBorderType)),
        ...(rightEdge.for(panel.rightBorderType).reverse()),
      ];
      rowOffsetXPx += panelWidth + innerMarginPx;
      return frame;
    });
    return rowFrames;
  });
  return frames;
}

function renderFramesToSVG(polygons, pageWidth, pageHeight) {
  let pathData = '';
  polygons.forEach(points => {
    const start = points[0];
    pathData += `M ${start[0]},${start[1]} `;
    for (let i = 1; i < points.length; i++) {
      pathData += `L ${points[i][0]},${points[i][1]} `;
    }
    pathData += 'Z ';
  });
  return pathData;
}
