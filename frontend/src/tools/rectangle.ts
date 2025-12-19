import type { ToolLogic } from "./types";

export const RectangleTool: ToolLogic = {
    onDown: (x, y, options) => {
        return {
            type: "rect",
            startX: x,
            startY: y,
            x,
            y,
            width: 0,
            height: 0,
            strokeColor: options.strokeColor,
            strokeWidth: options.strokeWidth,
            strokeType: options.strokeType,
            // Use the option if it exists, otherwise transparent
            fill: options.fill || "transparent",
        };
    },

    onMove: (x, y, currentData) => {
        const width = x - currentData.startX;
        const height = y - currentData.startY;

        return {
            ...currentData,
            x: width > 0 ? currentData.startX : x,
            y: height > 0 ? currentData.startY : y,
            width: Math.abs(width),
            height: Math.abs(height),
        };
    },

    onUp: (currentData, id) => {
        return {
            id,
            type: "rect",
            x: currentData.x,
            y: currentData.y,
            width: currentData.width,
            height: currentData.height,
            fill: currentData.fill,
            strokeColor: currentData.strokeColor,
            strokeWidth: currentData.strokeWidth,
            strokeType: currentData.strokeType,
        };
    },
};