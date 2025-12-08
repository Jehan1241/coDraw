import type { SyncedShape } from "@/hooks/useWhiteboard";
import type { ToolOptions } from "@/pages/BoardPage";
import type { Stage } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import type { YMap } from "node_modules/yjs/dist/src/internals";

export type CurrentShapeData = number[] | any;

export interface ToolInteractionContext {
    stage: Stage;
    yjsShapesMap: YMap<SyncedShape> | null;
    saveThumbnail: () => void;
    pointerPos: Vector2d | null;
}

export interface ToolLogic {
    onDown: (x: number, y: number, options: ToolOptions) => CurrentShapeData;
    onMove: (
        x: number,
        y: number,
        currentData: CurrentShapeData,
        context: ToolInteractionContext
    ) => CurrentShapeData;
    onUp: (currentData: CurrentShapeData, id: string) => SyncedShape | null;
}