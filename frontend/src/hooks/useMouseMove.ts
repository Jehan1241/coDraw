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
    setViewport: Dispatch<SetStateAction<{
        x: number;
        y: number;
        scale: number;
    }>>,
    yjsShapesMap: YMap<SyncedShape> | null
    setSelectedId: (id: string | null) => void;
}


export function useMouseMove({ throttledSetAwareness, saveThumbnail, setViewport, tool, yjsShapesMap, options, setSelectedId }: useMouseMoveProps) {

    const [currentShapeData, setCurrentShapeData] = useState<CurrentShapeData | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);


    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        const logic = TOOLS[tool];
        if (!logic || !yjsShapesMap) return;

        const stage = e.target.getStage();
        const pos = stage?.getRelativePointerPosition();
        const pointerPos = stage?.getPointerPosition();

        if (pos && stage) {
            setIsDrawing(true);
            const context: ToolInteractionContext = {
                stage,
                yjsShapesMap,
                saveThumbnail,
                pointerPos: pointerPos || null,
                setSelectedId,
                target: e.target as any,
            };

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
            const context: ToolInteractionContext = {
                stage,
                yjsShapesMap,
                saveThumbnail,
                pointerPos: stage.getPointerPosition() || null,
                setSelectedId,
            };
            const newData = logic.onMove(pos.x, pos.y, currentShapeData, context);
            setCurrentShapeData(newData);
        }
    };

    const handleMouseUp = () => {
        const logic = TOOLS[tool];
        if (!isDrawing || !logic || !yjsShapesMap || !currentShapeData) return;
        setIsDrawing(false);
        const uniqueId = crypto.randomUUID();
        const finalShape = logic.onUp(currentShapeData, uniqueId);
        if (finalShape) {
            yjsShapesMap.set(uniqueId, finalShape);
        }
        setCurrentShapeData(null);
        throttledSetAwareness(null, null, null);
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