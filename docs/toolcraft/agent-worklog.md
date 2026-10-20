# Toolcraft App Agent Worklog

## Status

Mode: product

Active change: gridium-1

## Decision Trail

### Change ID: gridium-1

- Entry type: first-delivery
- Request: "Yes, build my own version of this grid-shift type tool as a new project in Desktop/Claudio, written from scratch in my own style with the same core effect and controls, plus SVG/PNG export. use toolcraft"
- Task type: new generated app — custom Canvas 2D renderer, SVG vector export, schema/controls, image upload, playback timeline.
- User-visible result: Gridium shows text (or an uploaded image) through a grid of square windows. Each window slides the glyph by Shift X/Y per column and row, so the letterform breaks into offset slices; Squeeze, Compression and Rotation distort each cell by its row or distance from the centre, and Random motion drifts the cells over a seamless loop. Exports PNG/JPG and editable SVG.
- Source/reference checked: https://junimagelab.github.io/pattern/ (p5.js sketch "pattern" by Dongjun Choi), captured with REA analyze-web-bundle and read as source: one sketch.js with 80 px boxes, glyph offset dx = -col × gridShiftX, dy = -row × gridShiftY, Squeeze (row-fading Y stretch), Y compression and rotation by distance, sum-of-sines motion, Word/Sentence and Text/Image toggles. No code was copied; the effect was re-derived.
- Reference inputs: None (a live page inspected as code; no video, GIF, Figma or recording).
- Docs/contracts read: AGENTS.md; core/setup-export.md (SVG export); schema-reference.md (text/code controls); Printium and Facetium Toolcraft apps as working patterns for this runtime version.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, infinity-canvas-scene-bounds, interaction-surface-ownership, timeline-mode-choice, output-export-required, controls-section-inventory-required, renderer-technique-inventory, persistence-policy-explicit.
- View interaction intent: non-spatial — flat 2D type.
- Interaction ownership: every value is a global panel property-edit; the image is a panel collection-edit. Canvas shows output only.
- Decision: shift is a percentage of the cell (0% = same centre slice in every cell, 100% = slices line up into the whole glyph) so it survives cell-size changes. The reference's two modes became Pattern Full / Bowtie (Bowtie = the reference Sentence region, |col| > |row| or col = 0) plus a Cell size control; the reference's hand-placed box-number copy rules were not reproduced. Motion waves complete whole cycles per loop (10 s ÷ Speed) so playback loops seamlessly.
- Alternatives rejected: SVG DOM preview (hundreds of clipped nodes re-laid out every frame); WebGL (text texture for no gain); embedding raster images in SVG (forbidden by the runtime SVG policy — Image content exports PNG/JPG only, SVG reports a clear error).
- State/output mapping: content.* → glyph text/image, size, colour; grid.* → cell layout and per-cell offsets; distort.* → per-cell scaleY and rotation; motion.* → per-cell wave offsets and timeline duration; appearance.background/export.includeBackground → runtime background.
- Verification: typecheck passes; src/grid unit tests (9) pass; headless Chrome over CDP drove the real UI: Random motion advanced loop progress during playback, Export PNG downloaded a 4096×3072 PNG, Format → SVG then Export SVG downloaded an SVG (one text element, 315 clipped uses) that renders in Chrome; the SVG also passes the runtime serializer/validator. Contact sheets checked every control, multi-line text and Image mode.
- Risks: Risk: ai:check reports the SVG renderer's createElementNS/setAttribute calls (the documented vectorFrameRenderer pattern) as DOM host authority, the same known checker inconsistency seen in Facetium; all other code-health checks pass. Risk: SVG text uses the viewer's Helvetica/Arial, so glyphs may differ slightly from the preview on other machines. Risk: verify:delivery and Playwright browser specs were not run (no Playwright browsers installed).

## Decisions

### Renderer

- Decision: Canvas 2D preview and PNG export share drawGrid (clip each cell, translate, rotate, scale, draw glyph); SVG export writes the same cells as clipped uses of one live text element.
- Reason: a few hundred clipped glyph draws per frame stay fast in Canvas 2D; SVG keeps the text editable.
- Evidence: grid-draw.ts, grid-export.ts, grid.test.ts.

### View Interaction

- Decision: non-spatial.
- Reason: flat 2D type output with no camera.
- Evidence: gridReadiness.viewInteraction.

### Interaction Ownership

- Decision: all controls in the panel; canvas is output only.
- Reason: global settings with no spatial meaning on the canvas.
- Evidence: gridReadiness.interactionOwnership.

### Timeline

- Decision: playback timeline; duration = 10 s ÷ Speed.
- Reason: Random motion animates the grid; whole-cycle waves keep the loop seamless.
- Evidence: layoutGrid motion test (progress 0 and 1 match).

### Layers

- Decision: none.
- Reason: no layer workflow was requested.
- Evidence: schema has no layersModule.

### Controls

- Decision: Settings, Content, Grid, Distort, Motion sections.
- Reason: grouped by what the user is adjusting: what is shown, the windows, per-cell distortion, motion.
- Evidence: gridSectionInventory.

### Export

- Decision: PNG/JPG (runtime default) plus SVG (user-requested "plus SVG/PNG export").
- Reason: explicit request.
- Evidence: gridReadiness.exportIntent; headless downloads of gridium.png and gridium.svg.

### Performance

- Decision: workload dimensions source pixels, visible cells, backing pixels, export resolution; cell size hard minimum 10 px bounds the cell count.
- Reason: cost is one clipped draw per visible cell.
- Evidence: grid-performance-model.ts.

## Evidence

- Source reviewed: REA capture of junimagelab.github.io/pattern (p5.min.js + sketch.js), sketch.js read in full.

## Verification

See gridium-1 Verification above.

## Risks

- Risk: see gridium-1 Risks above.
