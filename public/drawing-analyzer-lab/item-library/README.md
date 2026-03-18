Place item-library image files in this folder.

Supported extensions:

- .png
- .jpg
- .jpeg
- .webp
- .gif

The Drawing Analyzer Lab Item Library tab scans this folder and builds the item cards.
Priority, dependencies, and price are persisted to:

`markdowns/drawing-analyzer-lab-item-library.md`

Automatic normalization:

- On library scan, API generates normalized PNGs in `public/drawing-analyzer-lab/item-library-normalized`.
- Normalization removes near-white background to transparent, trims whitespace, then resizes/centers every icon onto a fixed 512x512 transparent canvas.
- UI uses normalized images automatically.
