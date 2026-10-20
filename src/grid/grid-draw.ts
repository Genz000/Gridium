import { imageBox, textLines, type GridCell } from "./grid-layout";
import type { GridSettings } from "./grid-settings";
import { imageSurface, type GridImage } from "./grid-source";

export const FONT_FAMILY = "Helvetica, Arial, sans-serif";
export const FONT_WEIGHT = 700;

export type GridContent =
  | { kind: "text"; lines: { text: string; y: number }[]; size: number; ink: string }
  | { kind: "image"; image: GridImage; width: number; height: number };

/** What every cell shows, or null when Image is selected and nothing is uploaded yet. */
export function gridContent(settings: GridSettings, image: GridImage | null): GridContent | null {
  if (settings.source === "image") {
    if (!image) return null;
    return { kind: "image", image, ...imageBox(settings.size, image.width, image.height) };
  }
  return { kind: "text", lines: textLines(settings.text, settings.size), size: settings.size, ink: settings.ink };
}

type Context2D = CanvasRenderingContext2D;

/**
 * Draws the cells in scene coordinates. `pixelScale` is device pixels per scene pixel; cell clips are
 * snapped to whole device pixels so neighbouring windows meet without hairline seams.
 */
export function drawGrid(ctx: Context2D, cells: readonly GridCell[], content: GridContent, pixelScale: number) {
  const snap = (v: number) => Math.round(v * pixelScale) / pixelScale;
  if (content.kind === "text") {
    ctx.font = `${FONT_WEIGHT} ${content.size}px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = content.ink;
  }
  const surface = content.kind === "image" ? imageSurface(content.image.key) : undefined;
  if (content.kind === "image") {
    if (!surface) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  for (const cell of cells) {
    const x0 = snap(cell.x);
    const y0 = snap(cell.y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, snap(cell.x + cell.size) - x0, snap(cell.y + cell.size) - y0);
    ctx.clip();
    ctx.translate(cell.x + cell.size / 2, cell.y + cell.size / 2);
    if (cell.rotation !== 0) ctx.rotate((cell.rotation * Math.PI) / 180);
    if (cell.scaleY !== 1) ctx.scale(1, cell.scaleY);
    if (content.kind === "text") {
      for (const line of content.lines) ctx.fillText(line.text, cell.ox, cell.oy + line.y);
    } else {
      if (surface) ctx.drawImage(surface, cell.ox - content.width / 2, cell.oy - content.height / 2, content.width, content.height);
    }
    ctx.restore();
  }
}
