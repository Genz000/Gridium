import type { ToolcraftProductExportRenderer, ToolcraftProductSvgExportRenderer } from "@/toolcraft/runtime";

import { drawGrid, FONT_FAMILY, FONT_WEIGHT, gridContent } from "./grid-draw";
import { layoutGrid, round, textLines, type GridCell } from "./grid-layout";
import { exportPass } from "./grid-pipeline";
import { readGridSettings } from "./grid-settings";
import { cachedImage, imageSource } from "./grid-source";

/** Same cells as the preview at the exported loop position, drawn into the runtime's 2D frame. */
export const gridRasterExport: ToolcraftProductExportRenderer = {
  baseFileName: "gridium",
  async renderFrame({ context, frame, pixelRatio, state, rendererPipeline, signal, timelineProgress }) {
    const render = () => {
      signal.throwIfAborted();
      const settings = readGridSettings(state.values);
      const source = imageSource(state.mediaAssets);
      const image = cachedImage(source);
      if (settings.source === "image" && source && !image) throw new Error("The image is still loading. Try the export again in a moment.");
      const content = gridContent(settings, image);
      if (!content) return;
      context.save();
      context.translate(frame.x, frame.y);
      drawGrid(context, layoutGrid(settings, frame.width, frame.height, timelineProgress), content, pixelRatio);
      context.restore();
      signal.throwIfAborted();
    };
    if (rendererPipeline) await rendererPipeline.runPass(exportPass, undefined, render);
    else render();
  },
};

const SVG_NS = "http://www.w3.org/2000/svg";
const GLYPH_ID = "gridium-glyph";
const CLIP_ID = "gridium-cell";

/**
 * Editable vector frame: the text is one live <text> element in <defs>; every cell is a group
 * clipped to one shared square, holding a <use> of that text moved, rotated and squeezed.
 */
export const gridSvgExport: ToolcraftProductSvgExportRenderer = {
  baseFileName: "gridium",
  renderFrame({ container, frame, state, signal, timelineProgress }) {
    signal.throwIfAborted();
    const settings = readGridSettings(state.values);
    if (settings.source === "image") {
      throw new Error("SVG export keeps text editable, so it needs Text content. Switch Source to Text, or export PNG for images.");
    }
    const cells = layoutGrid(settings, frame.width, frame.height, timelineProgress);

    const root = container.ownerDocument.createElementNS(SVG_NS, "g");
    root.setAttribute("data-gridium-grid", "true");
    root.setAttribute("transform", `translate(${round(frame.x)} ${round(frame.y)})`);
    const defs = container.ownerDocument.createElementNS(SVG_NS, "defs");
    const clip = container.ownerDocument.createElementNS(SVG_NS, "clipPath");
    clip.setAttribute("id", CLIP_ID);
    clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    const square = container.ownerDocument.createElementNS(SVG_NS, "rect");
    square.setAttribute("width", String(round(settings.cell)));
    square.setAttribute("height", String(round(settings.cell)));
    clip.append(square);
    const text = container.ownerDocument.createElementNS(SVG_NS, "text");
    text.setAttribute("id", GLYPH_ID);
    text.setAttribute("font-family", FONT_FAMILY);
    text.setAttribute("font-weight", String(FONT_WEIGHT));
    text.setAttribute("font-size", String(round(settings.size)));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", settings.ink);
    for (const line of textLines(settings.text, settings.size)) {
      const tspan = container.ownerDocument.createElementNS(SVG_NS, "tspan");
      tspan.setAttribute("x", "0");
      tspan.setAttribute("y", String(round(line.y)));
      tspan.textContent = line.text;
      text.append(tspan);
    }
    defs.append(clip, text);
    root.append(defs);

    for (const cell of cells) {
      const group = container.ownerDocument.createElementNS(SVG_NS, "g");
      group.setAttribute("transform", `translate(${round(cell.x)} ${round(cell.y)})`);
      group.setAttribute("clip-path", `url(#${CLIP_ID})`);
      const use = container.ownerDocument.createElementNS(SVG_NS, "use");
      use.setAttribute("href", `#${GLYPH_ID}`);
      use.setAttribute("transform", cellTransform(cell, settings.cell / 2));
      group.append(use);
      root.append(group);
    }
    container.append(root);
  },
};

/** Cell centre, then rotation and vertical squeeze, then the glyph offset: the same order as the canvas draw. */
export function cellTransform(cell: GridCell, half: number): string {
  const parts = [`translate(${round(half)} ${round(half)})`];
  if (cell.rotation !== 0) parts.push(`rotate(${round(cell.rotation)})`);
  if (cell.scaleY !== 1) parts.push(`scale(1 ${round(cell.scaleY)})`);
  parts.push(`translate(${round(cell.ox)} ${round(cell.oy)})`);
  return parts.join(" ");
}
