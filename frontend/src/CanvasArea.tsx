// src/components/CanvasArea.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { Stage, Layer, Line, Path, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Tool } from "@/pages/BoardPage";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb"; // Local storage
import * as Y from "yjs";
import { Cursor } from "@/components/ui/cursor";

// --- TYPE DEFINITIONS ---
type LineData = number[];

type SyncedShape = {
  id: string;
  type: "line";
  points: number[];
};

interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
}

interface ActiveUser {
  clientId: number;
  name: string;
  color: string;
}

interface CanvasAreaProps {
  tool: Tool;
  boardId: string;
  onActiveUsersChange?: (users: ActiveUser[]) => void;
}
// --- END TYPE DEFINITIONS ---

// --- UTILITY FUNCTIONS ---
function throttle(fn: (...args: any[]) => void, delay: number) {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (!timer) {
      fn(...args);
      timer = window.setTimeout(() => {
        timer = null;
      }, delay);
    }
  };
}

function getRandomColor() {
  const colors = ['#EC5E41', '#F29F05', '#F2CB05', '#04BF9D', '#038C7F'];
  return colors[Math.floor(Math.random() * colors.length)];
}
// ---

export function CanvasArea({ tool, boardId, onActiveUsersChange }: CanvasAreaProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  // 1. ANONYMOUS IDENTITY: Generate random name/color
  const [myColor] = useState(getRandomColor());
  const [myName] = useState(`Guest ${Math.floor(Math.random() * 1000)}`);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [yjsShapesMap, setYjsShapesMap] = useState<Y.Map<SyncedShape> | null>(null);

  const [syncedShapes, setSyncedShapes] = useState<SyncedShape[]>([]);
  const [currentLine, setCurrentLine] = useState<LineData>([]);

  // Cursor State
  const cursorsRef = useRef(new Map<number, CursorData>());
  const [smoothCursors, setSmoothCursors] = useState(new Map<number, CursorData>());
  const [remoteLines, setRemoteLines] = useState(new Map<number, number[]>());

  const animationRef = useRef(0);
  const smoothingFactor = 0.2;

  const throttledSetAwareness = useRef(
    throttle((x: number | null, y: number | null, points: number[] | null) => {
      const payload: any = {};
      if (x !== null && y !== null) payload.cursor = { x, y };
      if (points) payload.drawing = points;
      else payload.drawing = null;

      if (Object.keys(payload).length > 0) {
        // 2. UPDATE: Use local random identity
        providerRef.current?.setAwarenessField('user', {
          name: myName,
          color: myColor,
          ...payload
        });
      }
    }, 30)
  ).current;


  // --- LIFECYCLE AND CONNECTION ---
  useEffect(() => {
    const ydoc = new Y.Doc();
    const yMap = ydoc.getMap<SyncedShape>("shapes");

    // 3. NEW: CONNECT LOCAL PERSISTENCE (Browser Storage)
    const localProvider = new IndexeddbPersistence(boardId, ydoc);

    localProvider.on('synced', () => {
      setSyncedShapes(Array.from(yMap.values()));
    });

    // 4. CONNECT NETWORK (No Token)
    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: boardId,
      document: ydoc,
      // No token needed
    });

    provider.setAwarenessField('user', {
      name: myName,
      color: myColor,
    });

    providerRef.current = provider;
    setYjsShapesMap(yMap);

    const onSync = () => setSyncedShapes(Array.from(yMap.values()));
    yMap.observe(onSync);

    const onAwarenessUpdate = () => {
      const newCursors = new Map<number, CursorData>();
      const newRemoteLines = new Map<number, number[]>();
      const activeUsersList: ActiveUser[] = [];

      const states = provider.awareness.getStates();

      states.forEach((state, clientID) => {
        if (state.user) {
          activeUsersList.push({
            clientId: clientID,
            name: state.user.name,
            color: state.user.color,
          });

          if (clientID !== provider.awareness.clientID) {
            if (state.user.cursor?.x != null && state.user.cursor?.y != null) {
              newCursors.set(clientID, {
                x: state.user.cursor.x,
                y: state.user.cursor.y,
                name: state.user.name,
                color: state.user.color,
              });
            }
            if (state.user.drawing && state.user.drawing.length > 0) {
              newRemoteLines.set(clientID, state.user.drawing);
            }
          }
        }
      });

      cursorsRef.current = newCursors;
      setRemoteLines(newRemoteLines);
      if (onActiveUsersChange) onActiveUsersChange(activeUsersList);
    };
    provider.on('awarenessUpdate', onAwarenessUpdate);

    // Animation Loop
    const smoothUpdate = () => {
      setSmoothCursors((prev) => {
        const updated = new Map(prev);
        let changed = false;

        // FIX: Iterate over cursorsRef.current, NOT cursors state
        cursorsRef.current.forEach((raw, id) => {
          const prevSmooth = prev.get(id);

          if (!prevSmooth) {
            updated.set(id, raw);
            changed = true; // Mark as changed
            return;
          }

          const sx = prevSmooth.x + (raw.x - prevSmooth.x) * smoothingFactor;
          const sy = prevSmooth.y + (raw.y - prevSmooth.y) * smoothingFactor;

          // Only update if there is significant movement
          if (Math.abs(raw.x - sx) > 0.1 || Math.abs(raw.y - sy) > 0.1) {
            updated.set(id, { ...raw, x: sx, y: sy });
            changed = true;
          } else if (prevSmooth.x !== raw.x) {
            updated.set(id, raw); // Snap
            changed = true;
          }
        });

        // Remove cursors that disappeared
        prev.forEach((_, id) => {
          // FIX: Check against cursorsRef.current
          if (!cursorsRef.current.has(id)) {
            updated.delete(id);
            changed = true;
          }
        });

        // Optimization: Return the old object if nothing changed to prevent re-render
        return changed ? updated : prev;
      });

      animationRef.current = requestAnimationFrame(smoothUpdate);
    };

    animationRef.current = requestAnimationFrame(smoothUpdate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      provider.destroy();
      localProvider.destroy(); // 5. CLEANUP LOCAL
      yMap.unobserve(onSync);
      providerRef.current = null;
    };
  }, [boardId, myName, myColor]); // Removed auth dependencies
  // --- END LIFECYCLE ---


  // --- (All your drawing handlers are exactly the same) ---
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (tool !== "pencil" || e.target !== e.target.getStage() || !yjsShapesMap) {
      return;
    }
    setIsDrawing(true);
    const pos = e.target.getStage()!.getPointerPosition();
    setCurrentLine([pos.x, pos.y]);
  }, [tool, yjsShapesMap]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== "pencil" || !yjsShapesMap) {
      return;
    }
    const stage = e.target.getStage();
    const pos = stage!.getPointerPosition();
    setCurrentLine((prevLine) => prevLine.concat([pos.x, pos.y]));
  }, [isDrawing, tool, yjsShapesMap]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || tool !== "pencil" || !yjsShapesMap) {
      return;
    }
    setIsDrawing(false);
    const uniqueId = crypto.randomUUID();
    const newLine: SyncedShape = {
      id: uniqueId,
      type: "line",
      points: currentLine,
    };
    yjsShapesMap.set(uniqueId, newLine);
    setCurrentLine([]);
    throttledSetAwareness(null, null, null);
  }, [isDrawing, tool, currentLine, yjsShapesMap]);


  // --- COMBINED STAGE HANDLERS ---
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        throttledSetAwareness(
          pos.x,
          pos.y,
          isDrawing ? currentLine.concat([pos.x, pos.y]) : null
        );
      }
    }
    handleMouseMove(e);
  };

  const handleStageMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
    handleMouseUp();
    throttledSetAwareness(null, null, null);
  };

  const cursorStyle = tool === "pencil" ? "crosshair" : "default";

  // --- RESPONSIVE CANVAS LOGIC ---
  const [stageSize, setStageSize] = useState({ width: 100, height: 100 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setStageSize({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    });
    observer.observe(container);
    return () => observer.unobserve(container);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-200"
      style={{ cursor: cursorStyle }}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
      >
        <Layer>
          {syncedShapes.map((shape) => {
            if (shape.type === "line") {
              return (
                <Line
                  key={shape.id}
                  points={shape.points}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }
            return null;
          })}

          {/* Render Remote Ghost Lines */}
          {Array.from(remoteLines.entries()).map(([clientID, points]) => (
            <Line
              key={`ghost-${clientID}`}
              points={points}
              stroke="#888"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={0.5}
            />
          ))}

          {/* Render Local Line */}
          <Line
            points={currentLine}
            stroke="black"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />

          {/* Render Smooth Cursors */}
          {Array.from(smoothCursors.entries()).map(([clientID, cursor]) => (
            <Cursor
              key={clientID}
              x={cursor.x}
              y={cursor.y}
              name={cursor.name}
              color={cursor.color}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}