import { useEffect } from "react";
import type { Tool } from "@/pages/BoardPage";

export const TOOL_HOTKEYS: Record<Tool, string> = {
    "select": "S",
    "pencil": "D",
    "rectangle": "R",
    "eraser": "E",
    "pan": "W",
    "text": "T"
};

export function useHotkeys(setTool: (tool: Tool) => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;
            const pressedKey = e.key.toLowerCase();
            const targetTool = (Object.keys(TOOL_HOTKEYS) as Tool[]).find(
                (tool) => TOOL_HOTKEYS[tool].toLowerCase() === pressedKey
            );
            if (targetTool) {
                setTool(targetTool);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setTool]);
}