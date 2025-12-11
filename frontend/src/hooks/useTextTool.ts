import type { Tool } from "@/pages/BoardPage";
import type React from "react";
import { useEffect } from "react";
import type { SyncedShape } from "./useWhiteboard";
import type { YMap } from "node_modules/yjs/dist/src/internals";

interface useTextToolProps {
    transformerRef: React.RefObject<any>,
    viewport: {
        x: number;
        y: number;
        scale: number;
    }
    editingId: string | null
    setEditingId: (id: string | null) => void;
    yjsShapesMap: YMap<SyncedShape> | null;
    selectedIds: Set<string>;
    tool: Tool;
    setTool: (tool: Tool) => void;
}

export function useTextTool({ transformerRef, viewport, editingId, yjsShapesMap, setTool, setEditingId, tool, selectedIds }: useTextToolProps) {
    const handleTextTransform = (e: any) => {
        const node = e.target;
        const anchor = transformerRef.current?.getActiveAnchor();

        const currentZoom = viewport.scale;
        const baseScale = 1 / currentZoom;

        const stretchX = node.scaleX() / baseScale;
        const stretchY = node.scaleY() / baseScale;

        if (['middle-left', 'middle-right'].includes(anchor)) {
            node.width(Math.max(20, node.width() * stretchX));
        }
        else if (['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(anchor)) {
            node.width(Math.max(20, node.width() * stretchX));
            node.fontSize(Math.max(12, node.fontSize() * stretchY));
        }

        node.scaleX(baseScale);
        node.scaleY(baseScale);
    };

    const handleTextTransformEnd = (node: any, shape: SyncedShape) => {
        const currentZoom = viewport.scale;

        if (yjsShapesMap) {
            yjsShapesMap.set(shape.id, {
                ...shape,
                x: node.x(),
                y: node.y(),
                rotation: node.rotation(),
                width: node.width() / currentZoom,
                fontSize: node.fontSize() / currentZoom,
                scaleX: 1,
                scaleY: 1,
            });
        }

        node.scaleX(1 / currentZoom);
        node.scaleY(1 / currentZoom);
    };

    const handleTextChange = (val: string) => {
        if (editingId && yjsShapesMap) {
            const shape = yjsShapesMap.get(editingId);
            if (shape) {
                yjsShapesMap.set(editingId, { ...shape, text: val, id: editingId });
            }
        }
    };

    const handleFinish = () => {
        if (editingId && yjsShapesMap) {
            const shape = yjsShapesMap.get(editingId);
            if (shape && (!shape.text || shape.text.trim() === "")) {
                yjsShapesMap.delete(editingId);
            }
        }
        setEditingId(null);
        setTool('select');
    };


    useEffect(() => {
        if (editingId) return;

        // If Text Tool is active + exactly 1 item selected + that item is text -> Edit it
        if (tool === 'text' && selectedIds.size === 1) {
            const id = selectedIds.values().next().value as string;
            const shape = yjsShapesMap?.get(id);
            if (shape && shape.type === 'text') {
                setEditingId(id);
            }
        }
    }, [selectedIds, yjsShapesMap, editingId]);

    const handleAttributeChange = (attrs: any) => {
        if (editingId && yjsShapesMap) {
            const shape = yjsShapesMap.get(editingId);
            if (shape) {
                // Merge existing shape with new attributes
                yjsShapesMap.set(editingId, { ...shape, ...attrs });
            }
        }
    };

    return ({ handleTextTransform, handleTextChange, handleFinish, handleTextTransformEnd, handleAttributeChange })
}