import { defineToolcraft, imageExportModule, mediaSourceModule, svgExportModule, timelineModule } from "@/toolcraft/runtime";

import { backgroundControls, contentControls, distortControls, gridControls, motionControls } from "../grid/grid-controls";
import { gridDefaults, loopSecondsFor } from "../grid/grid-settings";
import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";

export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    canvas: {
      enabled: true,
      upload: true,
      size: { width: 1600, height: 1200, unit: "px" },
      sizing: { mode: "editable-output" },
    },
    identity: appIdentity,
    panels: {
      controls: {
        sections: [
          { id: "runtime.setup", title: "Settings", controls: backgroundControls },
          { id: "content", title: "Content", controls: contentControls },
          { id: "grid", title: "Grid", controls: gridControls },
          { id: "distort", title: "Distort", controls: distortControls },
          { id: "motion", title: "Motion", controls: motionControls },
        ],
        title: "Controls",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    },
  },
  modules: [
    mediaSourceModule(),
    timelineModule({ mode: "playback", defaultDurationSeconds: loopSecondsFor(gridDefaults.speed) }),
    imageExportModule(),
    svgExportModule(),
  ],
});
