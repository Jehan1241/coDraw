import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { YMap } from "node_modules/yjs/dist/src/internals";
import type { SyncedShape } from "./useWhiteboard";

interface UseSelectionDeleteProps {
    selectedIds: Set<string>;
    setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
    yjsShapesMap: YMap<SyncedShape> | null;
}

export function useSelectionDelete({ selectedIds, setSelectedIds, yjsShapesMap }: UseSelectionDeleteProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Backspace or Delete
            if (e.key === "Backspace" || e.key === "Delete") {

                // Ensure we are not editing text (e.g., inside an input or textarea)
                const activeTag = document.activeElement?.tagName.toLowerCase();
                if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement).isContentEditable) {
                    return;
                }

                if (selectedIds.size > 0 && yjsShapesMap) {
                    e.preventDefault();

                    // Perform deletions in a single transaction for Undo/Redo stability
                    yjsShapesMap.doc?.transact(() => {
                        selectedIds.forEach((id) => {
                            yjsShapesMap.delete(id);
                        });
                    });

                    // Clear selection
                    setSelectedIds(new Set());
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIds, setSelectedIds, yjsShapesMap]);
}