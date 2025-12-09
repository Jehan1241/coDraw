
const createCursor = (svg: string, x: number, y: number) => {
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encoded}") ${x} ${y}, auto`;
};

const getCursorColor = (theme: string) => {
  const isDark = theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return isDark ? "white" : "black";
}

export function getRotateCursor(theme: string) {
  const cursorColor = getCursorColor(theme);
  const rotateSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw-icon lucide-refresh-ccw"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`;
  const rotateCursor = createCursor(rotateSvg, 12, 12);
  return rotateCursor;
}

export function getResizeCursor(theme: string) {
  const cursorColor = getCursorColor(theme);
  const resizeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-icon lucide-move"><path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/></svg>`;
  const resizeCursor = createCursor(resizeSvg, 12, 12);
  return resizeCursor;
}

export function getCursorStyle(theme: string, tool: string) {
  const cursorColor = getCursorColor(theme);

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

  if (tool === "select") {
    const selectSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mouse-pointer2-icon lucide-mouse-pointer-2"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/></svg>`)
    return `url("data:image/svg+xml;utf8,${selectSvg}") 3 3, auto`;
  }

  if (tool === "pan") {
    const panSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cursorColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-icon lucide-hand"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`)
    return `url("data:image/svg+xml;utf8,${panSvg}") 12 12, auto`;
  }

  if (tool === "rectangle") {
    const rectSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg"
         width="45" height="45" viewBox="0 0 24 24"
         fill="none" stroke="${cursorColor}" stroke-width="1.2"
         stroke-linecap="round" stroke-linejoin="round">

      <!-- Square with bottom-left corner broken -->
      <!-- Left vertical edge (broken near bottom) -->
      <line x1="6" y1="4" x2="6" y2="12"/>

      <!-- Top -->
      <line x1="6" y1="4" x2="20" y2="4"/>

      <!-- Right side -->
      <line x1="20" y1="4" x2="20" y2="18"/>

      <!-- Bottom (broken near left) -->
      <line x1="13" y1="18" x2="20" y2="18"/>

      <!-- Crosshair centered at bottom-left -->
      <!-- Horizontal -->
      <line x1="3" y1="18" x2="9" y2="18"/>

      <!-- Vertical -->
      <line x1="6" y1="15" x2="6" y2="21"/>

    </svg>
  `);

    return `url("data:image/svg+xml;utf8,${rectSvg}") 10 33, crosshair`;
  }
  return "default";
};