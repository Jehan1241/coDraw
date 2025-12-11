import type { ToolLogic } from "./types";
import type { SyncedShape } from "@/hooks/useWhiteboard";

const VISUAL_FONT_SIZE = 24; // Text will always look like it's 24px

export const TextTool: ToolLogic = {
    // 1. ON MOUSE DOWN
    onDown: (x, y, options, context) => {
        // 1. Get the LIVE zoom level
        const zoom = context.viewport.scale;

        // 2. Calculate the "Real" Font Size
        // If zoom is 0.1 (zoomed out), size becomes 240.
        // If zoom is 10 (zoomed in), size becomes 2.4.
        const scaledFontSize = Math.round(VISUAL_FONT_SIZE / zoom);

        return {
            x,
            y,
            fill: (options as any).strokeColor || "black",
            fontSize: scaledFontSize
        };
    },

    onMove: (_x, _y, currentData) => currentData,

    // 3. ON MOUSE UP
    onUp: (currentData, id, context) => {
        if (!currentData) return null;

        // 3. Calculate "Real" Width
        // We want a text box that looks like ~200px wide on screen.
        // So we scale the width logic same as font size.
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
            width: scaledWidth, // Use the scaled width

            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        };

        context.setSelectedIds(new Set([id]));

        return shape;
    },
};