import type { ToolLogic } from "./types";

export const EraserTool: ToolLogic = {
    // Capture the starting position on Mouse Down
    onDown: (x, y) => ({
        erasing: true,
        lastPos: { x, y }
    }),

    onMove: (_x, _y, currentData, { stage, yjsShapesMap, saveThumbnail, pointerPos }) => {
        // Safety checks
        if (!pointerPos || !yjsShapesMap || !currentData.lastPos) {
            return currentData;
        }

        const { lastPos } = currentData;
        const currentPos = pointerPos;
        let didDelete = false;

        // Calculate distance and angle for interpolation
        const dx = currentPos.x - lastPos.x;
        const dy = currentPos.y - lastPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Instead of checking once, we check every few pixels along the path.
        const stepSize = 5;
        const steps = Math.ceil(dist / stepSize);

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 1 : i / steps;
            const checkX = lastPos.x + (dx * t);
            const checkY = lastPos.y + (dy * t);
            const shape = stage.getIntersection({ x: checkX, y: checkY });

            if (shape && shape.attrs.id) {
                if (yjsShapesMap.has(shape.attrs.id)) {
                    yjsShapesMap.delete(shape.attrs.id);
                    didDelete = true;
                }
            }
        }

        if (didDelete) {
            saveThumbnail();
        }

        return {
            ...currentData,
            lastPos: { x: currentPos.x, y: currentPos.y }
        };
    },

    onUp: () => null,
};