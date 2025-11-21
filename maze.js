// Maze Generator Module

export const id = 'maze';
export const name = 'Maze';

export const options = [
  {
    id: 'height',
    label: 'Height (cells)',
    min: 5,
    max: 70,
    defaultValue: 25
  }
];

export function generate(params) {
  const heightInCells = params.height;

  // US Letter: 8.5" x 11" = 612pt x 792pt
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 54; // 0.75 inch margins

  // Calculate available space
  const availableWidth = PAGE_WIDTH - (2 * MARGIN);
  const availableHeight = PAGE_HEIGHT - (2 * MARGIN);

  // Calculate cell size based on height
  const cellSize = Math.floor(availableHeight / heightInCells);

  // Calculate border width proportional to cell size
  // At cell size 30, border width is 4 (ratio: 4/30 = 2/15)
  const STROKE_WIDTH = cellSize * 2 / 15;

  // Calculate width based on available space
  const widthInCells = Math.floor(availableWidth / cellSize);

  // Create and generate the maze
  const maze = new SquareMazeGraph(widthInCells, heightInCells);
  depthFirstSearch(maze);

  // Calculate actual maze dimensions
  const mazeWidth = widthInCells * cellSize;
  const mazeHeight = heightInCells * cellSize;

  // Center the maze on the page
  const offsetX = (PAGE_WIDTH - mazeWidth) / 2;
  const offsetY = (PAGE_HEIGHT - mazeHeight) / 2;

  // Helper function to convert cell ID to x,y coordinates
  const cellIdToXY = (id) => [
    id % maze.width,
    Math.floor(id / maze.width)
  ];

  // Helper function to get boundary endpoints
  const boundaryToEndpoints = (boundary) => {
    if (boundary.secondId - boundary.firstId === 1) {
      // cells are horizontally adjacent
      const [cellX, cellY] = cellIdToXY(boundary.secondId);
      return [
        [cellX * cellSize, cellY * cellSize],
        [cellX * cellSize, (cellY + 1) * cellSize],
      ];
    } else {
      // cells are vertically adjacent
      const [cellX, cellY] = cellIdToXY(boundary.secondId);
      return [
        [cellX * cellSize, cellY * cellSize],
        [(cellX + 1) * cellSize, cellY * cellSize],
      ];
    }
  };

  // Build SVG path with extended endpoints to ensure corners meet
  const bottom = maze.height * cellSize;
  const right = maze.width * cellSize;
  const halfStroke = STROKE_WIDTH / 2;

  // Helper to extend line endpoints by half stroke width
  const extendLine = (x1, y1, x2, y2) => {
    if (x1 === x2) {
      // Vertical line - extend y coordinates
      const yMin = Math.min(y1, y2) - halfStroke;
      const yMax = Math.max(y1, y2) + halfStroke;
      return [x1, yMin, x1, yMax];  // Use same x for both points
    } else {
      // Horizontal line - extend x coordinates
      const xMin = Math.min(x1, x2) - halfStroke;
      const xMax = Math.max(x1, x2) + halfStroke;
      return [xMin, y1, xMax, y1];  // Use same y for both points
    }
  };

  let pathData = '';

  // Draw maze outer edges (with opening at top-left and bottom-right)
  // Left edge
  let [x1, y1, x2, y2] = extendLine(0, 0, 0, bottom);
  pathData += `M ${x1},${y1} L ${x2},${y2} `;

  // Bottom edge (with gap)
  [x1, y1, x2, y2] = extendLine(0, bottom, right - cellSize, bottom);
  pathData += `M ${x1},${y1} L ${x2},${y2} `;

  // Top edge (with gap)
  [x1, y1, x2, y2] = extendLine(cellSize, 0, right, 0);
  pathData += `M ${x1},${y1} L ${x2},${y2} `;

  // Right edge
  [x1, y1, x2, y2] = extendLine(right, 0, right, bottom);
  pathData += `M ${x1},${y1} L ${x2},${y2} `;

  // Draw internal walls
  const walls = maze.boundaries.filter(b => b.isWall);
  walls.forEach(boundary => {
    const [[origX1, origY1], [origX2, origY2]] = boundaryToEndpoints(boundary);
    [x1, y1, x2, y2] = extendLine(origX1, origY1, origX2, origY2);
    pathData += `M ${x1},${y1} L ${x2},${y2} `;
  });

  return `<svg viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${offsetX}, ${offsetY})">
      <path d="${pathData}" fill="none" stroke="black" stroke-width="${STROKE_WIDTH}" stroke-linecap="butt"/>
    </g>
  </svg>`;
}

// ============================================================================
// MAZE GENERATION CLASSES AND ALGORITHMS
// ============================================================================

class MazeCellBoundary {
  constructor(graph, firstId, secondId) {
    this._graph = graph;
    if (firstId < secondId) {
      this._firstId = firstId;
      this._secondId = secondId;
    } else {
      this._firstId = secondId;
      this._secondId = firstId;
    }
  }

  get firstId() {
    return this._firstId;
  }

  get secondId() {
    return this._secondId;
  }

  get borderingCells() {
    return [
      new MazeCell(this._graph, this.firstId),
      new MazeCell(this._graph, this.secondId),
    ];
  }

  get isWall() {
    return this._graph.isWall(this);
  }

  set isWall(newValue) {
    this._graph.setWall(this, newValue);
  }

  traverseFrom(cell) {
    if (cell.id === this.firstId) {
      return new MazeCell(this._graph, this.secondId);
    } else {
      return new MazeCell(this._graph, this.firstId);
    }
  }
}

class MazeCell {
  constructor(graph, id) {
    this._graph = graph;
    this._id = id;
  }

  get graph() {
    return this._graph;
  }

  get id() {
    return this._id;
  }

  get boundaries() {
    return this._graph.getNeighborIds(this._id)
      .map(neighborId => new MazeCellBoundary(
        this._graph,
        this._id,
        neighborId
      ))
  }

  get neighbors() {
    return this._graph.getNeighborIds(this._id)
      .map(neighborId => new MazeCell(this._graph, neighborId))
  }

  boundaryBetween(cell) {
    if (!this._graph.getNeighborIds(this._id).includes(cell.id)) {
      throw new Error('Cannot get boundary; cells are not neighbors.')
    }
    return new MazeCellBoundary(this._graph, this._id, cell.id);
  }
}

class SquareMazeGraph {
  constructor(width, height) {
    this._width = width;
    this._height = height;
    this._edges = new Uint8Array(width * height * 2);
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get cells() {
    return [...Array(this._width * this._height).keys()]
      .map(id => new MazeCell(this, id));
  }

  get boundaries() {
    return this.cells.flatMap(cell =>
      cell.boundaries.filter(b => b.firstId === cell.id)
    );
  }

  setAllBoundaries(shouldBeWalls) {
    const fill = shouldBeWalls ? 1 : 0;
    this._edges.fill(fill);
  }

  isWall(boundary) {
    const addr = this._getWallAddress(
      boundary.firstId,
      boundary.secondId,
    );
    return !!this._edges[addr];
  }

  setWall(boundary, shouldBeWall) {
    const addr = this._getWallAddress(
      boundary.firstId,
      boundary.secondId,
    );
    this._edges[addr] = shouldBeWall ? 1 : 0;
  }

  getNeighborIds(id) {
    const x = id % this._width;
    const y = Math.floor(id / this._width);
    const toAddr = (x, y) => x + y * this._width;
    return [
      x > 0 ? toAddr(x - 1, y) : null,
      y > 0 ? toAddr(x, y - 1) : null,
      x < (this._width - 1) ? toAddr(x + 1, y) : null,
      y < (this._height - 1) ? toAddr(x, y + 1) : null,
    ].filter(x => x !== null);
  }

  _getWallAddress(smallerCellId, largerCellId) {
    const areCellHorizontallyAdjacent = largerCellId - smallerCellId === 1;
    return smallerCellId * 2 + (areCellHorizontallyAdjacent ? 1 : 0);
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function depthFirstSearch(maze) {
  maze.setAllBoundaries(true);

  const allCells = maze.cells;
  const startCell = pickRandom(allCells);
  const backtrackStack = [startCell];
  const visitedIds = new Set([startCell.id]);

  while (backtrackStack.length) {
    const thisCell = backtrackStack.pop();
    const unvisitedNeighbors = thisCell.neighbors
      .filter(cell => !visitedIds.has(cell.id));

    if (unvisitedNeighbors.length === 0) {
      continue;
    }

    backtrackStack.push(thisCell);
    const nextCell = pickRandom(unvisitedNeighbors);
    visitedIds.add(nextCell.id);
    backtrackStack.push(nextCell);
    const wallToRemove = thisCell.boundaryBetween(nextCell);
    wallToRemove.isWall = false;
  }
}
