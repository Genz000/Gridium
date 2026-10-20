import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { getToolcraftTimelineLoopProgress } from "@/toolcraft/runtime";
import {
  useToolcraftDispatch, useToolcraftMediaPresentationUrls, useToolcraftPipelinePass, useToolcraftProductSceneFrame,
  useToolcraftSelector, useToolcraftViewportInteractionActive,
} from "@/toolcraft/runtime/react";

import { drawGrid, gridContent } from "./grid-draw";
import { layoutGrid } from "./grid-layout";
import { framePass, sourcePass } from "./grid-pipeline";
import { backingScale, loopSecondsFor, readGridSettings } from "./grid-settings";
import { imageSource, loadImage, sourceKey, type GridImage } from "./grid-source";
import styles from "./grid.module.css";

export function GridCanvas() {
  const frame = useToolcraftProductSceneFrame();
  const values = useToolcraftSelector((state) => state.values);
  const media = useToolcraftSelector((state) => state.mediaAssets);
  const zoom = useToolcraftSelector((state) => state.canvas.zoom);
  const currentTimeSeconds = useToolcraftSelector((state) => state.timeline.currentTimeSeconds);
  const durationSeconds = useToolcraftSelector((state) => state.timeline.durationSeconds);
  const dispatch = useToolcraftDispatch();
  const viewportActive = useToolcraftViewportInteractionActive();
  const settings = useMemo(() => readGridSettings(values), [values]);

  const loopSeconds = loopSecondsFor(settings.speed);
  useEffect(() => {
    if (Math.abs(loopSeconds - durationSeconds) > 0.001) {
      dispatch({ type: "timeline.setDuration", durationSeconds: loopSeconds } as never);
    }
  }, [dispatch, loopSeconds, durationSeconds]);
  // Without Random motion the frame does not depend on time, so playback does not redraw it.
  const progress = settings.motion > 0 ? getToolcraftTimelineLoopProgress({ currentTimeSeconds, durationSeconds }) : 0;

  const source = useMemo(() => imageSource(media), [media]);
  const urls = useToolcraftMediaPresentationUrls(media);
  const url = source ? urls.get(source.id) : undefined;
  const key = source && url ? sourceKey(source) : "none";
  const loaded = useToolcraftPipelinePass(sourcePass, { resources: key }, () => (source && url ? loadImage(source, url) : null));
  const image = loaded.status === "success" ? (loaded.result as GridImage | null) : null;
  const content = useMemo(() => gridContent(settings, image), [settings, image]);

  const rect = frame.kind === "ready" ? frame.rect : null;
  // Backing follows the on-screen size at 2x; during a pan/zoom gesture the previous resolution is kept.
  const heldScale = useRef(0);
  const liveScale = rect ? backingScale(rect.width, rect.height, zoom / 100, globalThis.devicePixelRatio || 1) : 0;
  if (!viewportActive || !heldScale.current) heldScale.current = liveScale;
  const scale = heldScale.current;
  const backingW = rect ? Math.round(rect.width * scale) : 0;
  const backingH = rect ? Math.round(rect.height * scale) : 0;
  const frameKey = `${backingW}x${backingH}#${rect?.width}x${rect?.height}#${image?.key ?? ""}#${progress.toFixed(5)}#${JSON.stringify(settings)}`;
  const drawn = useToolcraftPipelinePass(framePass, { frame: frameKey }, () => frameKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rect || !backingW || !backingH) return;
    if (canvas.width !== backingW) canvas.width = backingW;
    if (canvas.height !== backingH) canvas.height = backingH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, backingW, backingH);
    if (!content) return;
    const k = backingW / rect.width;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawGrid(ctx, layoutGrid(settings, rect.width, rect.height, progress), content, k);
  }, [settings, content, progress, backingW, backingH, rect?.width, rect?.height]);

  if (!rect) return null;
  return (
    <canvas
      ref={canvasRef}
      className={styles.output}
      data-testid="grid-output"
      data-toolcraft-product-output=""
      data-frame-ready={drawn.status === "success" ? "true" : "false"}
      data-image-ready={settings.source === "image" ? (image ? "true" : "false") : "none"}
      data-loop-progress={progress.toFixed(4)}
      aria-label="Grid shift preview"
    />
  );
}
