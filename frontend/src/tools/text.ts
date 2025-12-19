import type { ToolLogic } from "./types";
import type { SyncedShape } from "@/hooks/useWhiteboard";

const VISUAL_FONT_SIZE = 24;

export const TextTool: ToolLogic = {
    onDown: (x, y, options, context) => {
        const zoom = context.viewport.scale;

        const scaledFontSize = Math.round(VISUAL_FONT_SIZE / zoom);

        return {
            x,
            y,
            fill: (options as any).strokeColor || "black",
            fontSize: scaledFontSize
        };
    },

    onMove: (_x, _y, currentData) => currentData,

    onUp: (currentData, id, context) => {
        if (!currentData) return null;

        const scaledWidth = Math.round(200 / context.viewport.scale);

        const shape: SyncedShape = {
            id,
            type: 'text',
            x: currentData.x,
            y: currentData.y,
            text: "",

            fill: currentData.fill,
            fontSize: currentData.fontSize,
            fontFamily: "sans-serif",
            align: "left",
            width: scaledWidth,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        };

        context.setSelectedIds(new Set([id]));

        return shape;
    },
};