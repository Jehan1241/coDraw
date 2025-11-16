// src/components/CanvasArea.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Tool } from "@/pages/BoardPage";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { useAuth } from '@/contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
// FIX: Assuming the Cursor component is now in its correct place
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

  // FIX: This holds the live Provider instance
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [yjsShapesMap, setYjsShapesMap] = useState<Y.Map<SyncedShape> | null>(null);

  const [syncedShapes, setSyncedShapes] = useState<SyncedShape[]>([]);
  const [currentLine, setCurrentLine] = useState<LineData>([]);
  const [cursors, setCursors] = useState(new Map<number, CursorData>());

  const [smoothCursors, setSmoothCursors] = useState(new Map<number, CursorData>());
  const animationRef = useRef(0);
  const smoothingFactor = 0.2; // 20% glide speed

  const userEmail = token ? (jwtDecode(token) as { email: string }).email : 'Guest';
  const userColor = useRef(getRandomColor());

  // FIX: Create a stable throttled function that uses the *current* ref value
  const throttledSetAwareness = useRef(
    throttle((x: number | null, y: number | null) => {
      // Use the current value of the provider ref, which is updated in useEffect
      providerRef.current?.setAwarenessField('cursor', { x, y });
    }, 30)
  ).current;


  useEffect(() => {
    function animate() {
      setSmoothCursors((prev) => {
        const updated = new Map(prev);

        cursors.forEach((raw, id) => {
          const prevSmooth = prev.get(id);

          if (!prevSmooth) {
            // First time seeing this cursor → jump directly to position
            updated.set(id, raw);
            return;
          }

          // Linear interpolation for smooth motion
          const sx = prevSmooth.x + (raw.x - prevSmooth.x) * smoothingFactor;
          const sy = prevSmooth.y + (raw.y - prevSmooth.y) * smoothingFactor;

          updated.set(id, { ...raw, x: sx, y: sy });
        });

        // Remove cursors that disappeared
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


  // --- LIFECYCLE AND CONNECTION ---
  useEffect(() => {
    const ydoc = new Y.Doc();
    const yMap = ydoc.getMap<SyncedShape>("shapes");

    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: boardId,
      document: ydoc,
      token: token || undefined,
    });

    // SET AWARENESS STATE FOR CURRENT USER
    provider.setAwarenessField('user', {
      name: userEmail,
      color: userColor.current,
    });

    // Update state and ref
    providerRef.current = provider; // FIX: Crucially update the ref here
    setYjsShapesMap(yMap);

    const onSync = () => {
      setSyncedShapes(Array.from(yMap.values()));
    };
    yMap.observe(onSync);

    const onAwarenessUpdate = () => {
      const newCursors = new Map<number, CursorData>();
      const states = provider.awareness.getStates();

      states.forEach((state, clientID) => {
        if (clientID !== provider.awareness.clientID && state.user && state.cursor) {
          newCursors.set(clientID, {
            x: state.cursor.x,
            y: state.cursor.y,
            name: state.user.name,
            color: state.user.color,
          });
        }
      });
      setCursors(newCursors);
    };
    provider.on('awarenessUpdate', onAwarenessUpdate);

    return () => {
      // CLEANUP
      provider.destroy();
      yMap.unobserve(onSync);
      // Clear the ref
      providerRef.current = null;
    };
  }, [boardId, token, userEmail]);
  // --- END LIFECYCLE ---


  // --- HANDLERS (Drawing Logic) ---
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
  }, [isDrawing, tool, currentLine, yjsShapesMap]);
  // --- END DRAWING LOGIC ---


  // --- COMBINED STAGE HANDLERS (Cursor + Drawing) ---
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    // 1. Send Awareness update
    const stage = e.target.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        throttledSetAwareness(pos.x, pos.y);
      }
    }
    // 2. Call the drawing function
    handleMouseMove(e);
  };

  const handleStageMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
    // 1. Run MouseUp/Drawing Cleanup
    handleMouseUp();
    // 2. Hide Cursor
    throttledSetAwareness(null, null);
  };
  // --- END COMBINED HANDLERS ---

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

          {/* Render the "in-progress" line */}
          <Line
            points={currentLine}
            stroke="black"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />

          {/* Render all other users' cursors */}
          {Array.from(smoothCursors.entries()).map(([clientID, cursor]) => (
            // Only render if the cursor coordinates are defined (not null)
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