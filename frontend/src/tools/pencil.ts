import type { ToolLogic } from "./types";

export const PencilTool: ToolLogic = {
    onDown: (x, y) => {
        return [x, y];
    },

    onMove: (x, y, currentData) => {
        return (currentData as number[]).concat([x, y]);
    },

    onUp: (currentData, id) => {
        return {
            id,
            type: "line",
            points: currentData as number[],
        };
    },
};