// src/components/CanvasArea.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Tool } from "@/pages/BoardPage";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { useAuth } from '@/contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
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

interface CanvasAreaProps {
  tool: Tool;
  boardId: string;
  // Assuming you still have the prop from the previous step, if not, remove this line
  onActiveUsersChange?: (users: any[]) => void;
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

export function CanvasArea({ tool, boardId }: CanvasAreaProps) {
  const { token } = useAuth();
  const [isDrawing, setIsDrawing] = useState(false);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [yjsShapesMap, setYjsShapesMap] = useState<Y.Map<SyncedShape> | null>(null);

  const [syncedShapes, setSyncedShapes] = useState<SyncedShape[]>([]);
  const [currentLine, setCurrentLine] = useState<LineData>([]);
  const [cursors, setCursors] = useState(new Map<number, CursorData>());

  const [smoothCursors, setSmoothCursors] = useState(new Map<number, CursorData>());

  // --- 1. NEW: State for Ghost Lines ---
  const [remoteLines, setRemoteLines] = useState(new Map<number, number[]>());
  // -------------------------------------

  const animationRef = useRef(0);
  const smoothingFactor = 0.2;

  const userEmail = token ? (jwtDecode(token) as { email: string }).email : 'Guest';
  const userColor = useRef(getRandomColor());

  // --- 2. UPDATE: Throttler now accepts points ---
  const throttledSetAwareness = useRef(
    throttle((x: number | null, y: number | null, points: number[] | null) => {
      // Send Cursor
      if (x !== null && y !== null) {
        providerRef.current?.setAwarenessField('cursor', { x, y });
      }
      // Send Drawing (Ghost Line)
      if (points) {
        providerRef.current?.setAwarenessField('drawing', points);
      } else {
        // If null, clear the drawing field
        providerRef.current?.setAwarenessField('drawing', null);
      }
    }, 30)
  ).current;


  useEffect(() => {
    function animate() {
      setSmoothCursors((prev) => {
        const updated = new Map(prev);

        cursors.forEach((raw, id) => {
          const prevSmooth = prev.get(id);

          if (!prevSmooth) {
            updated.set(id, raw);
            return;
          }

          const sx = prevSmooth.x + (raw.x - prevSmooth.x) * smoothingFactor;
          const sy = prevSmooth.y + (raw.y - prevSmooth.y) * smoothingFactor;

          updated.set(id, { ...raw, x: sx, y: sy });
        });

        prev.forEach((_, id) => {
          if (!cursors.has(id)) {
            updated.delete(id);
          }
        });

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [cursors, smoothingFactor]);


  useEffect(() => {
    const ydoc = new Y.Doc();
    const yMap = ydoc.getMap<SyncedShape>("shapes");

    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: boardId,
      document: ydoc,
      token: token || undefined,
    });

    provider.setAwarenessField('user', {
      name: userEmail,
      color: userColor.current,
    });

    providerRef.current = provider;
    setYjsShapesMap(yMap);

    const onSync = () => {
      setSyncedShapes(Array.from(yMap.values()));
    };
    yMap.observe(onSync);

    const onAwarenessUpdate = () => {
      const newCursors = new Map<number, CursorData>();
      const newRemoteLines = new Map<number, number[]>(); // --- 3. NEW MAP ---

      const states = provider.awareness.getStates();

      states.forEach((state, clientID) => {
        if (clientID !== provider.awareness.clientID && state.user) {
          // Handle Cursors
          if (state.cursor && state.cursor.x !== null && state.cursor.y !== null) {
            newCursors.set(clientID, {
              x: state.cursor.x,
              y: state.cursor.y,
              name: state.user.name,
              color: state.user.color,
            });
          }
          // --- 4. NEW: Handle Ghost Lines ---
          if (state.drawing && state.drawing.length > 0) {
            newRemoteLines.set(clientID, state.drawing);
          }
        }
      });

      setCursors(newCursors);
      setRemoteLines(newRemoteLines); // --- 5. NEW: Update State ---
    };
    provider.on('awarenessUpdate', onAwarenessUpdate);

    return () => {
      provider.destroy();
      yMap.unobserve(onSync);
      providerRef.current = null;
    };
  }, [boardId, token, userEmail]);


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

    // --- 6. NEW: Clear ghost line on mouse up ---
    throttledSetAwareness(null, null, null);
  }, [isDrawing, tool, currentLine, yjsShapesMap]);


  // --- COMBINED STAGE HANDLERS ---
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        // --- 7. UPDATE: Send Cursor AND Drawing Data ---
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
    // --- 8. UPDATE: Clear everything ---
    throttledSetAwareness(null, null, null);
  };

  const cursorStyle = tool === "pencil" ? "crosshair" : "default";

  return (
    <div
      className="w-full h-full bg-gray-200"
      style={{ cursor: cursorStyle }}
    >
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
      >
        <Layer>
          {/* Synced Shapes */}
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

          {/* --- 9. NEW: Render Remote Ghost Lines --- */}
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

          {/* Local Line */}
          <Line
            points={currentLine}
            stroke="black"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />

          {/* Smooth Cursors */}
          {Array.from(smoothCursors.entries()).map(([clientID, cursor]) => (
            cursor.x !== null && cursor.y !== null && (
              <Cursor
                key={clientID}
                x={cursor.x}
                y={cursor.y}
                name={cursor.name}
                color={cursor.color}
              />
            )
          ))}
        </Layer>
      </Stage>
    </div>
  );
}