import type { ToolcraftComponentAcceptance } from "./acceptance/types";
import { gridAcceptance } from "../grid/grid-acceptance";
import { gridReadiness, gridSectionInventory, gridTransferMode } from "../grid/grid-inventory";

export const appTransferMode = gridTransferMode;

export const appProductReadiness = gridReadiness;

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = gridAcceptance;

// Product entries use the same explicit stable section IDs as appSchema.
export const appControlSectionInventory = gridSectionInventory;
