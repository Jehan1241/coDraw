import type { ToolLogic } from "./types";

export const PencilTool: ToolLogic = {
    onDown: (x, y, options) => {
        return {
            points: [x, y],
            strokeColor: options.strokeColor,
            strokeWidth: options.strokeWidth,
            strokeType: options.strokeType,
        };
    },

    onMove: (x, y, currentData) => {
        return {
            ...currentData,
            points: [...currentData.points, x, y]
        };
    },

    onUp: (currentData, id) => {
        return {
            id,
            type: "line",
            strokeColor: currentData.strokeColor,
            strokeWidth: currentData.strokeWidth,
            strokeType: currentData.strokeType,
            points: currentData.points
        };
    },
};