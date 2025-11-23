import { useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";


const SCALE_BY = 1.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

interface useZoomProps {
    stageRef: any,
    stageSize: any,
}

export function useZoom({ stageRef, stageSize }: useZoomProps) {

    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    const zoomToCenter = (direction: 1 | -1 | 0) => {
        const stage = stageRef.current;
        if (!stage) return;

        // Reset
        if (direction === 0) {
            setStageScale(1);
            setStagePos({ x: 0, y: 0 });
            return;
        }

        const oldScale = stage.scaleX();
        const currentPos = { x: stage.x(), y: stage.y() };
        const center = { x: stageSize.width / 2, y: stageSize.height / 2 };

        // Logic relative to center instead of pointer
        const relatedTo = {
            x: (center.x - currentPos.x) / oldScale,
            y: (center.y - currentPos.y) / oldScale,
        };

        const newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
        if (newScale < MIN_ZOOM || newScale > MAX_ZOOM) return;

        setStageScale(newScale);
        setStagePos({
            x: center.x - relatedTo.x * newScale,
            y: center.y - relatedTo.y * newScale,
        });
    };

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        // A. ZOOM (Ctrl + Wheel)
        if (e.evt.ctrlKey || e.evt.metaKey) {
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const direction = e.evt.deltaY > 0 ? -1 : 1;
            const newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

            if (newScale < MIN_ZOOM || newScale > MAX_ZOOM) return;

            setStageScale(newScale);
            setStagePos({
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            });
        }
        // B. PAN (Standard Wheel)
        else {
            const newX = stage.x() - e.evt.deltaX;
            const newY = stage.y() - e.evt.deltaY;

            setStagePos({ x: newX, y: newY });
        }
    };

    return ({ zoomToCenter, stagePos, stageScale, handleWheel })
}