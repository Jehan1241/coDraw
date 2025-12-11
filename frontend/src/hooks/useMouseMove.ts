import type { KonvaEventObject } from "konva/lib/Node";
import { TOOLS } from "@/tools/toolpicker";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { CurrentShapeData, ToolInteractionContext } from "@/tools/types";
import type { Tool, ToolOptions } from "@/pages/BoardPage";
import type { SyncedShape } from "./useWhiteboard";
import type { YMap } from "node_modules/yjs/dist/src/internals";

interface useMouseMoveProps {
    throttledSetAwareness: (...args: any[]) => void,
    saveThumbnail: () => void,
    tool: Tool,
    options: ToolOptions,
    setViewport: Dispatch<SetStateAction<{ x: number; y: number; scale: number; }>>,
    yjsShapesMap: YMap<SyncedShape> | null,
    setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
    setSelectionBox: Dispatch<SetStateAction<{ x: number, y: number, width: number, height: number } | null>>;
    selectedIds: Set<string>;
}

export function useMouseMove({
    throttledSetAwareness,
    saveThumbnail,
    setViewport,
    tool,
    yjsShapesMap,
    options,
    setSelectedIds,
    setSelectionBox,
    selectedIds
}: useMouseMoveProps) {

    const [currentShapeData, setCurrentShapeData] = useState<CurrentShapeData | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Helper to generate fresh context
    const createContext = (stage: any, e: KonvaEventObject<MouseEvent>): ToolInteractionContext => ({
        stage,
        yjsShapesMap,
        saveThumbnail,
        pointerPos: stage.getPointerPosition() || null,
        target: e.target as any,
        setSelectedIds,
        setSelectionBox,
        selectedIds,
        originalEvent: e.evt,
        viewport: { scale: stage.scaleX() || 1 }
    });

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        const logic = TOOLS[tool];
        if (!logic || !yjsShapesMap) return;

        const stage = e.target.getStage();
        const pos = stage?.getRelativePointerPosition();

        if (pos && stage) {
            setIsDrawing(true);
            const context = createContext(stage, e);
            const newData = logic.onDown(pos.x, pos.y, options, context);
            setCurrentShapeData(newData);
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        const logic = TOOLS[tool];
        if (!isDrawing || !logic || !yjsShapesMap || !currentShapeData) return;

        const stage = e.target.getStage();
        const pos = stage?.getRelativePointerPosition();

        if (pos && stage) {
            const context = createContext(stage, e);
            const newData = logic.onMove(pos.x, pos.y, currentShapeData, context);
            setCurrentShapeData(newData);
        }
    };

    const handleMouseUp = (e: KonvaEventObject<MouseEvent>) => {
        const logic = TOOLS[tool];
        if (!isDrawing || !logic || !yjsShapesMap || !currentShapeData) return;

        const stage = e.target.getStage();
        if (stage) {
            setIsDrawing(false);
            const uniqueId = crypto.randomUUID();
            const context = createContext(stage, e);
            const finalShape = logic.onUp(currentShapeData, uniqueId, context);

            if (finalShape) {
                if (!finalShape.id) finalShape.id = uniqueId;
                yjsShapesMap.set(finalShape.id, finalShape);
            }

            const pos = stage.getRelativePointerPosition();
            if (pos) {
                throttledSetAwareness(pos.x, pos.y, null);
            } else {
                throttledSetAwareness(null, null, null);
            }
        }

        setCurrentShapeData(null);
        saveThumbnail();
    };

    const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) {
            const pos = stage.getRelativePointerPosition();
            if (pos) {
                const ghostData = (isDrawing && currentShapeData) ? currentShapeData : null;
                throttledSetAwareness(pos.x, pos.y, ghostData);
            }
        }
        handleMouseMove(e);
    };

    const handleStageMouseLeave = (_: KonvaEventObject<MouseEvent>) => {
        throttledSetAwareness(null, null, null);
    };

    const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
        if (e.target === e.target.getStage()) {
            setViewport(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }))
        }
    };

    return ({ mouseHandlers: { onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onDragEnd: handleDragEnd, onStageLeave: handleStageMouseLeave, onStageMouseMove: handleStageMouseMove }, currentShapeData })
}