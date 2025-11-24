# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based tool for generating printable activity pages for kids. Includes three activity types: mazes (depth-first search algorithm), math worksheets (addition, subtraction, multiplication, comparison), and comic book frames (random layouts). The project is designed as a single-file static HTML application with no build process required.

**Live site:** https://kiddoactivities.johnellmore.com/

## Architecture

### Single-File Static Design

The application is intentionally structured as a standalone HTML file (`index.html`) that can be opened directly in a browser or hosted as a static webpage. No build process, package manager, or server is required.

### Module System

The application uses ES6 modules to separate activity types into independent files:

- `index.html` - Main HTML file containing UI, state management, and PDF generation logic
- `maze.js` - Maze generation using depth-first search on a square grid graph
- `math.js` - Math worksheet generation with configurable problem types
- `comic.js` - Comic book frame generation with random layouts

Each activity module exports:
- `id` - Unique identifier string
- `name` - Display name for UI
- `options` - Array of configurable parameters with min/max/default values
- `generate(params)` - Function that returns SVG string for US Letter (612x792pt) page

### State Management

The application maintains a simple in-memory state object in `index.html`:
```javascript
const state = {
  pages: [],    // Array of {id, type, svg} objects
  nextId: 1     // Auto-incrementing page ID
}
```

Pages are prepended to the array (newest first) and rendered as thumbnails in the preview area.

### SVG-Based Rendering

All activities generate SVG output using the US Letter portrait format (8.5" x 11" = 612pt x 792pt). SVG elements are converted to PDF using the pdf-lib library:
- `<path>` elements → `drawSvgPath()`
- `<line>` elements → `drawLine()`
- `<rect>` elements → `drawRectangle()`
- `<text>` elements → `drawText()` with Helvetica font

The PDF generation logic handles SVG-to-PDF coordinate transformation (SVG origin top-left, PDF origin bottom-left).

### Activity Module Pattern

When adding new activity types:
1. Create a new `.js` file following the module pattern (see existing modules)
2. Export `id`, `name`, `options` array, and `generate()` function
3. Import the module in `index.html` and add to `activityModules` array
4. The UI will automatically generate controls and integrate the new activity

## Development Workflow

**Local testing:** Open `index.html` directly in a browser (no server required)

**Deployment:** Copy `index.html` and all `.js` files to any static hosting service

## Technical Constraints

- Pure vanilla JavaScript, HTML, CSS (no frameworks or build tools)
- External dependency: pdf-lib (loaded via CDN in HTML)
- All activities must output SVG strings sized for US Letter portrait (612x792pt)
- Mobile-friendly UI using flexbox and media queries
- SVG stroke widths should be calculated proportionally to maintain visual consistency across different scales

## Key Implementation Details

### Maze Generation (maze.js)

Uses a depth-first search algorithm on a `SquareMazeGraph` data structure. The graph uses a `Uint8Array` to efficiently store wall states. Border extension logic ensures crisp corners by extending line endpoints by half the stroke width.

### Math Worksheets (math.js)

Problems are generated with validation (subtraction ensures positive results, multiplication keeps products under 30). Uses fixed-width Courier font for number alignment and Fisher-Yates shuffle to randomize problem order. Comparison problems span 2 columns while arithmetic problems take 1 column.

### Comic Frames (comic.js)

Template-based system using a string DSL (e.g., "2/1|1") parsed into panel layouts. The `Edger` class generates various separator types ('|', '/', '\', '>', '<') between panels. Random row layouts are chosen from predefined width patterns ([1], [1,1], [1,2], [2,1], [1,1,1]).
