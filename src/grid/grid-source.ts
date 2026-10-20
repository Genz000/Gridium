import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";

import { IMAGE_TARGET } from "./grid-settings";

/** Longest edge an uploaded image is decoded at. */
export const SOURCE_MAX_EDGE = 2048;

export type SourceTransform = { flipHorizontal: boolean; flipVertical: boolean; rotationDeg: number };
export type ImageSource = { id: string; resourceRef: string; transform: SourceTransform };
/** A decoded, oriented image; its pixels are looked up with imageSurface(key). */
export type GridImage = { key: string; width: number; height: number };

export function imageSource(media: readonly ToolcraftMediaAsset[]): ImageSource | null {
  const asset = media.find((a) => a.sourceTarget === IMAGE_TARGET && a.assetKind === "image" && a.lifecycle === "ready");
  if (!asset || asset.assetKind !== "image") return null;
  const t = asset.transform;
  return {
    id: asset.id,
    resourceRef: asset.resourceRef,
    transform: { flipHorizontal: !!t?.flipHorizontal, flipVertical: !!t?.flipVertical, rotationDeg: t?.rotationDeg ?? 0 },
  };
}

export const sourceKey = (source: ImageSource) => {
  const t = source.transform;
  return `${source.resourceRef}|${t.rotationDeg}${t.flipHorizontal ? "h" : ""}${t.flipVertical ? "v" : ""}`;
};

const pending = new Map<string, Promise<GridImage>>();
const ready = new Map<string, GridImage>();
const surfaces = new Map<string, OffscreenCanvas>();

export const imageSurface = (key: string) => surfaces.get(key);

export async function loadImage(source: ImageSource, url: string): Promise<GridImage> {
  const key = sourceKey(source);
  const hit = ready.get(key);
  if (hit) return hit;
  let job = pending.get(key);
  if (!job) {
    job = decode(key, url, source.transform).then((image) => {
      if (ready.size > 8) {
        const kept = surfaces.get(key);
        ready.clear();
        surfaces.clear();
        if (kept) surfaces.set(key, kept);
      }
      ready.set(key, image);
      return image;
    });
    job.catch(() => pending.delete(key));
    pending.set(key, job);
  }
  return job;
}

export const cachedImage = (source: ImageSource | null) => (source ? ready.get(sourceKey(source)) ?? null : null);

/** Decodes through an image element so SVG files rasterise too, then applies the runtime's rotate/flip. */
async function decode(key: string, url: string, transform: SourceTransform): Promise<GridImage> {
  const image = new Image();
  image.src = url;
  await image.decode();
  const iw = image.naturalWidth || SOURCE_MAX_EDGE;
  const ih = image.naturalHeight || SOURCE_MAX_EDGE;
  const k = Math.min(1, SOURCE_MAX_EDGE / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * k));
  const h = Math.max(1, Math.round(ih * k));
  const quarter = transform.rotationDeg === 90 || transform.rotationDeg === 270;
  const width = quarter ? h : w;
  const height = quarter ? w : h;
  const surface = new OffscreenCanvas(width, height);
  const ctx = surface.getContext("2d")!;
  ctx.translate(width / 2, height / 2);
  ctx.rotate((transform.rotationDeg * Math.PI) / 180);
  ctx.scale(transform.flipHorizontal ? -1 : 1, transform.flipVertical ? -1 : 1);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  surfaces.set(key, surface);
  return { key, width, height };
}
