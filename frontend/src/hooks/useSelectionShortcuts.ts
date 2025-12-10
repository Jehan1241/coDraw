import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { YMap } from "node_modules/yjs/dist/src/internals";
import type { SyncedShape } from "./useWhiteboard";

interface UseSelectionShortcutsProps {
    selectedIds: Set<string>;
    setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
    yjsShapesMap: YMap<SyncedShape> | null;
}

const createOffsetClone = (shape: SyncedShape): SyncedShape => {
    const newId = crypto.randomUUID();
    const clone = { ...shape, id: newId };

    if (clone.x !== undefined && clone.y !== undefined) {
        clone.x += 20;
        clone.y += 20;
    }

    if (clone.points) {
        clone.points = clone.points.map((p) => p + 20);
    }

    return clone;
};

export function useSelectionShortcuts({ selectedIds, setSelectedIds, yjsShapesMap }: UseSelectionShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement).isContentEditable) return;

            const isCmdOrCtrl = e.ctrlKey || e.metaKey;

            // --- DELETE ---
            if (e.key === "Backspace" || e.key === "Delete") {
                if (selectedIds.size > 0 && yjsShapesMap) {
                    e.preventDefault();
                    yjsShapesMap.doc?.transact(() => {
                        selectedIds.forEach((id) => yjsShapesMap.delete(id));
                    });
                    setSelectedIds(new Set());
                }
            }

            // --- COPY ---
            if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
                if (selectedIds.size > 0 && yjsShapesMap) {
                    e.preventDefault();
                    const shapes = Array.from(selectedIds)
                        .map(id => yjsShapesMap.get(id))
                        .filter(Boolean);

                    if (shapes.length > 0) {
                        await navigator.clipboard.writeText(JSON.stringify(shapes));
                    }
                }
            }

            // --- PASTE ---
            if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
                if (!yjsShapesMap) return;

                try {
                    const text = await navigator.clipboard.readText();
                    const shapes = JSON.parse(text) as SyncedShape[];

                    if (!Array.isArray(shapes) || !shapes.length) return;
                    e.preventDefault();

                    const newSelection = new Set<string>();

                    yjsShapesMap.doc?.transact(() => {
                        shapes.forEach((shape) => {
                            const newShape = createOffsetClone(shape);
                            yjsShapesMap.set(newShape.id, newShape);
                            newSelection.add(newShape.id);
                        });
                    });

                    setSelectedIds(newSelection);
                } catch (err) {
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIds, setSelectedIds, yjsShapesMap]);
}