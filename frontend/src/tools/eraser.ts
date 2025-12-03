import type { ToolLogic } from "./types";

export const EraserTool: ToolLogic = {
    onDown: () => ({ erasing: true }),
    onMove: (_x, _y, currentData, { stage, yjsShapesMap, saveThumbnail, pointerPos }) => {
        if (pointerPos && yjsShapesMap) {
            const shape = stage.getIntersection(pointerPos);
            if (shape && shape.attrs.id) {
                yjsShapesMap.delete(shape.attrs.id);
                saveThumbnail();
            }
        }
        return currentData;
    },

    onUp: () => null,
};