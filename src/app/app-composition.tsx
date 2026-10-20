import { getToolcraftFiniteArtboardRect } from "@/toolcraft/runtime";
import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { GridCanvas } from "../grid/GridCanvas";
import { gridRasterExport, gridSvgExport } from "../grid/grid-export";
import { gridPipeline } from "../grid/grid-pipeline";
import { appSchema } from "./app-schema";

export const appComposition = composeToolcraftApp(appSchema, {
  scene: {
    canvasContent: <GridCanvas />,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [getToolcraftFiniteArtboardRect(state.canvas.size)],
    rasterFrameRenderer: gridRasterExport,
    vectorFrameRenderer: gridSvgExport,
  },
  renderer: { pipelineRegistration: gridPipeline },
});
