import type { ToolLogic } from "./types";
import { PencilTool } from "./pencil";
import { EraserTool } from "./eraser";
import { RectangleTool } from "./rectangle";
import { SelectTool } from "./select";
import { TextTool } from "./text";
import { MagicTool } from "./magic";

// Map tool names (strings) to their implementation
export const TOOLS: Record<string, ToolLogic> = {
    pencil: PencilTool,
    eraser: EraserTool,
    select: SelectTool,
    pan: { onDown: () => null, onMove: () => null, onUp: () => null },
    rectangle: RectangleTool,
    text: TextTool,
    magic: MagicTool,
};
