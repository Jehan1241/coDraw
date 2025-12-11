import type { SyncedShape } from "@/hooks/useWhiteboard";
import type { ToolOptions } from "@/pages/BoardPage";
import type { Stage } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import type { YMap } from "node_modules/yjs/dist/src/internals";
import type { Node } from "konva/lib/Node";
import type { Dispatch, SetStateAction } from "react";

export type CurrentShapeData = number[] | any;

export interface ToolInteractionContext {
    stage: Stage;
    yjsShapesMap: YMap<SyncedShape> | null;
    saveThumbnail: () => void;
    pointerPos: Vector2d | null;
    target?: Node;
    setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
    setSelectionBox: Dispatch<SetStateAction<{ x: number, y: number, width: number, height: number } | null>>;
    selectedIds: Set<string>;
    originalEvent: MouseEvent | TouchEvent;
    viewport: { scale: number };
}

export interface ToolLogic {
    onDown: (x: number, y: number, options: ToolOptions, context: ToolInteractionContext) => CurrentShapeData;
    onMove: (
        x: number,
        y: number,
        currentData: CurrentShapeData,
        context: ToolInteractionContext
    ) => CurrentShapeData;

    onUp: (
        currentData: CurrentShapeData,
        id: string,
        context: ToolInteractionContext
    ) => SyncedShape | null;
}