import type { ToolLogic } from "./types";
import type { Node } from "konva/lib/Node";

export const SelectTool: ToolLogic = {
    onDown: (_x, _y, _options, { stage, setSelectedId, target }) => {
        // 1. Background clicked -> Deselect
        if (!target || target === stage) {
            setSelectedId(null);
            return {};
        }

        // 2. Ignore Transformer (Resize Handles)
        let check: Node | null = target;
        while (check && check !== stage) {
            if (check.getClassName() === "Transformer") {
                return {};
            }
            check = check.getParent();
        }

        // 3. Select Shape (Target or Parent Group)
        const shapeId = target.id() || target.getParent()?.id();
        setSelectedId(shapeId || null);

        return {};
    },

    onMove: (_x, _y, currentData) => currentData,
    onUp: () => null,
};