export function getCursorStyle(theme: string, tool: string) {
    // 1. Check if Dark Mode is active (supports 'system' preference too)
    const isDark = theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // 2. Set color based on mode
    const cursorColor = isDark ? "white" : "black";

    if (tool === "eraser") {
        const eraserSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32" fill="${cursorColor}">
        <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>
      </svg>`);
        return `url("data:image/svg+xml;utf8,${eraserSvg}") 16 16, auto`;
    }

    if (tool === "pencil") {
        const pencilSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${cursorColor}"  fill-opacity="0.15" stroke="${cursorColor}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`)
        return `url("data:image/svg+xml;utf8,${pencilSvg}") 0 32, auto`;
    }

    if (tool === "pan") return "grab";
    return "default";
};