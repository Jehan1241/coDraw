import type { ToolLogic } from "./types";

export const EraserTool: ToolLogic = {
    onDown: (_x, _y) => ({
        erasing: true,
        lastScreenPos: null
    }),

    onMove: (_x, _y, currentData, { stage, yjsShapesMap, saveThumbnail }) => {
        const currentScreenPos = stage.getPointerPosition();

        if (!currentScreenPos || !yjsShapesMap) {
            return currentData;
        }

        const lastScreenPos = currentData.lastScreenPos || currentScreenPos;
        let didDelete = false;

        const dx = currentScreenPos.x - lastScreenPos.x;
        const dy = currentScreenPos.y - lastScreenPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check every 5 screen pixels
        const stepSize = 5;
        const steps = Math.ceil(dist / stepSize);

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 1 : i / steps;

            const checkX = lastScreenPos.x + (dx * t);
            const checkY = lastScreenPos.y + (dy * t);

            const shape = stage.getIntersection({ x: checkX, y: checkY });

            if (shape && shape.attrs.id) {
                if (yjsShapesMap.has(shape.attrs.id)) {
                    yjsShapesMap.delete(shape.attrs.id);
                    shape.visible(false);
                    didDelete = true;
                }
            }
        }

        if (didDelete) {
            stage.batchDraw();
            saveThumbnail();
        }

        return {
            ...currentData,
            lastScreenPos: currentScreenPos
        };
    },

    onUp: () => null,
};