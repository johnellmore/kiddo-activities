# Kiddo Activities

A web-based tool for generating printable activity pages for kids.

[Try it out](https://kiddoactivities.johnellmore.com/)

## Features

- **Three activity types:**
  - Mazes (depth-first search algorithm)
  - Math worksheets (addition, subtraction, multiplication, comparison)
  - Comic book frames (random layouts)

- **Single-file static HTML** - works as a hosted webpage, no build process
- **Mobile-friendly** - usable on iPhone for quick printing
- **PDF generation** - creates printable PDFs using pdf-lib
- **SVG-based** - vector graphics for crisp printing at any size

## Usage

1. Open `index.html` in a browser
2. Select an activity type
3. Adjust parameters using sliders
4. Click "Add Page" to generate pages
5. Click "Generate PDF" to create a printable PDF

## Technical Details

- Pure vanilla JavaScript, HTML, CSS
- All activities generate SVG output
- US Letter (8.5" x 11") portrait format only
