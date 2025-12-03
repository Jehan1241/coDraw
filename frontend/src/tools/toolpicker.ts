import type { ToolLogic } from "./types";
import { PencilTool } from "./pencil";
import { EraserTool } from "./eraser";

// Map tool names (strings) to their implementation
export const TOOLS: Record<string, ToolLogic> = {
    pencil: PencilTool,
    eraser: EraserTool,
    select: { onDown: () => null, onMove: () => null, onUp: () => null },
};