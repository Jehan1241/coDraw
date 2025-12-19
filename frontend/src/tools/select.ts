import type { ToolLogic } from "./types";
import Konva from "konva";

const linesIntersect = (a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number) => {
    const det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) return false;
    const lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    const gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};

function segmentIntersectsRect(
    x1: number, y1: number,
    x2: number, y2: number,
    rect: { x: number, y: number, width: number, height: number }
) {
    if (x1 >= rect.x && x1 <= rect.x + rect.width && y1 >= rect.y && y1 <= rect.y + rect.height) return true;
    if (x2 >= rect.x && x2 <= rect.x + rect.width && y2 >= rect.y && y2 <= rect.y + rect.height) return true;

    const rx = rect.x, ry = rect.y, rw = rect.width, rh = rect.height;

    if (linesIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true;
    if (linesIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true;
    if (linesIntersect(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh)) return true;
    if (linesIntersect(x1, y1, x2, y2, rx, ry + rh, rx, ry)) return true;

    return false;
}

export const SelectTool: ToolLogic = {
    onDown: (x, y, _options, { stage, setSelectedIds, target, originalEvent }) => {
        const isShift = (originalEvent as MouseEvent).shiftKey;
        const isBackground = !target || target === stage || target === stage.getLayers()[0];

        if (isBackground) {
            if (!isShift) setSelectedIds(new Set());
            return { selecting: true, startX: x, startY: y };
        }

        let check: any = target;
        while (check && check !== stage) {
            if (check.getClassName() === "Transformer") return {};
            check = check.getParent();
        }

        const shapeId = target.id() || target.getParent()?.id();
        if (shapeId) {
            setSelectedIds((prev) => {
                if (isShift) {
                    const next = new Set(prev);
                    if (next.has(shapeId)) next.delete(shapeId);
                    else next.add(shapeId);
                    return next;
                }
                if (prev.has(shapeId)) return prev;
                return new Set([shapeId]);
            });
        }
        return {};
    },

    onMove: (x, y, currentData, { setSelectionBox }) => {
        if (!currentData.selecting) return currentData;

        setSelectionBox({
            x: Math.min(currentData.startX, x),
            y: Math.min(currentData.startY, y),
            width: Math.abs(x - currentData.startX),
            height: Math.abs(y - currentData.startY),
        });

        return { ...currentData, currentX: x, currentY: y };
    },

    onUp: (currentData, _id, { stage, setSelectionBox, setSelectedIds, originalEvent }) => {
        if (currentData.selecting && currentData.currentX !== undefined) {

            const pos = stage.getRelativePointerPosition();
            const finalX = pos ? pos.x : currentData.currentX;
            const finalY = pos ? pos.y : currentData.currentY;

            const box = {
                x: Math.min(currentData.startX, finalX),
                y: Math.min(currentData.startY, finalY),
                width: Math.abs(finalX - currentData.startX),
                height: Math.abs(finalY - currentData.startY),
            };

            const newSelection = new Set<string>();
            const layer = stage.getLayers()[0];
            const children = layer.getChildren();

            children.forEach((node: any) => {
                if (!node.id() || node.name() !== "whiteboard-object" || !node.isVisible() || !node.listening()) return;

                const shapeRect = node.getClientRect({ relativeTo: layer, skipShadow: true });
                if (!Konva.Util.haveIntersection(box, shapeRect)) return;

                const points = typeof node.points === 'function' ? node.points() : node.attrs.points;

                if (points && Array.isArray(points)) {
                    let isIntersecting = false;
                    const transform = node.getTransform();

                    for (let i = 0; i < points.length - 2; i += 2) {
                        const p1 = transform.point({ x: points[i], y: points[i + 1] });
                        const p2 = transform.point({ x: points[i + 2], y: points[i + 3] });

                        if (segmentIntersectsRect(p1.x, p1.y, p2.x, p2.y, box)) {
                            isIntersecting = true;
                            break;
                        }
                    }
                    if (isIntersecting) newSelection.add(node.id());
                }
                else {
                    newSelection.add(node.id());
                }
            });

            setSelectedIds((prev) => {
                if ((originalEvent as MouseEvent).shiftKey) {
                    const next = new Set(prev);
                    newSelection.forEach(id => next.add(id));
                    return next;
                }
                return newSelection.size > 0 ? newSelection : new Set();
            });
        }

        setSelectionBox(null);
        return null;
    }
};