# Gridium

Grid-shift type tool. Your text, or an image, is seen through a grid of square windows. Each window slides the letterform a little further than the last, so it breaks into offset slices that can be squeezed, turned and set in motion. Exports PNG, JPG or editable SVG.

**Try it:** https://genz000.github.io/Gridium/ (desktop browser, window at least 1024 px wide)

## What it does

- Content: one letter, a word or several lines of text, or an uploaded image; size and colour
- Grid: Full (fills the canvas) or Bowtie (the centre row and column, fanning out diagonally), cell size, and Shift X / Shift Y, which set how far the glyph slides per column and row. 0% repeats the same centre slice in every cell; 100% lines the slices up into the whole glyph
- Distort: Squeeze stretches or flattens the centre rows, Compression flattens cells further from the centre, Rotation turns them
- Motion: every cell drifts on its own waves; the animation is one seamless loop, and Speed sets its length
- Export PNG/JPG (2K, 4K, 8K) or SVG. In the SVG the text stays live and editable: one text element, with each cell a clipped copy of it. Image content exports as PNG/JPG only

## How to use

1. In **Content**, type your text (Enter starts a new line) or switch **Source** to *Image* and add a picture. Set **Size** and **Color**.
2. In **Grid**, choose **Pattern** and **Cell size**, then move **Shift X** and **Shift Y** to break up the letterform.
3. Add **Squeeze**, **Compression** and **Rotation** in **Distort**.
4. Raise **Random motion** in **Motion** to animate it. Turn on **Timeline** in **Settings** to pause or scrub.
5. Set the background and canvas size in **Settings**, choose a format in **Image Export**, and use the export button at the bottom of the panel. Exports capture the frame under the playhead.

## Run locally

```bash
npm install
npm run dev
```

## Author

Made by Nader Boulaich — [naderboulaich.net](https://naderboulaich.net).

Inspired by [pattern](https://junimagelab.github.io/pattern/) by Dongjun Choi; Gridium is an independent implementation.

Third-party code included in this repository keeps its own license; see `LICENSE.md` and `NOTICE.md`.
