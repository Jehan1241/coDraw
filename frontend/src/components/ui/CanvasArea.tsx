import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Tool } from "@/pages/BoardPage";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { Cursor } from "@/components/ui/cursor";
import { useUser } from "@/contexts/UserContext";
import { BoardStorage } from "../../utils/boardStorage";

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

export function CanvasArea({ tool, boardId, onActiveUsersChange }: CanvasAreaProps) {

  const { user } = useUser();
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<any>(null);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const [yjsShapesMap, setYjsShapesMap] = useState<Y.Map<SyncedShape> | null>(null);

  const [syncedShapes, setSyncedShapes] = useState<SyncedShape[]>([]);
  const [currentLine, setCurrentLine] = useState<LineData>([]);
  const [cursors, setCursors] = useState(new Map<number, CursorData>());

  const [smoothCursors, setSmoothCursors] = useState(new Map<number, CursorData>());
  const [remoteLines, setRemoteLines] = useState(new Map<number, number[]>());

  const animationRef = useRef(0);
  const smoothingFactor = 0.2;

  // 3. FIX: Keep a ref to the current user so the throttler can read the LATEST name
  const userRef = useRef(user);

  //Forces username to update immediately
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const saveThumbnail = () => {
    if (!stageRef.current) return;
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 0.2,
      mimeType: "image/png",
    });

    BoardStorage.update(boardId, { thumbnail: dataURL });
  };

  const throttledSetAwareness = useRef(
    throttle((x: number | null, y: number | null, points: number[] | null) => {
      const payload: any = {};
      if (x !== null && y !== null) payload.cursor = { x, y };
      if (points) payload.drawing = points;
      else payload.drawing = null;

      if (Object.keys(payload).length > 0) {
        providerRef.current?.setAwarenessField('user', {
          name: userRef.current.name,
          color: userRef.current.color,
          ...payload
        });
      }
    }, 30)
  ).current;

  useEffect(() => {
    function animate() {
      setSmoothCursors((prev) => {
        const updated = new Map(prev);
        const currentCursors = cursors; // Read from state closure

        currentCursors.forEach((raw, id) => {
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
          if (!currentCursors.has(id)) {
            updated.delete(id);
          }
        });

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [cursors]);


  // --- LIFECYCLE AND CONNECTION ---
  useEffect(() => {
    const ydoc = new Y.Doc();
    const yMap = ydoc.getMap<SyncedShape>("shapes");

    const localProvider = new IndexeddbPersistence(boardId, ydoc);
    localProvider.on('synced', () => {
      setSyncedShapes(Array.from(yMap.values()));
    });

    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: boardId,
      document: ydoc,
    });

    // 6. FIX: Use userRef for initial setup
    provider.setAwarenessField('user', {
      name: userRef.current.name,
      color: userRef.current.color,
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
      setCursors(newCursors);
      setRemoteLines(newRemoteLines);
      if (onActiveUsersChange) onActiveUsersChange(activeUsersList);
    };
    provider.on('awarenessUpdate', onAwarenessUpdate);

    return () => {
      provider.destroy();
      yMap.unobserve(onSync);
      providerRef.current = null;
    };
  }, [boardId, onActiveUsersChange]); // 7. FIX: Removed user dependencies to prevent reconnect
  // --- END LIFECYCLE ---


  // --- HANDLERS (Drawing Logic) ---
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool !== "pencil" || e.target !== e.target.getStage() || !yjsShapesMap) {
      return;
    }
    setIsDrawing(true);
    const pos = e.target.getStage()!.getPointerPosition();
    setCurrentLine([pos.x, pos.y]);
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== "pencil" || !yjsShapesMap) {
      return;
    }
    const stage = e.target.getStage();
    const pos = stage!.getPointerPosition();
    setCurrentLine((prevLine) => prevLine.concat([pos.x, pos.y]));
  }

  const handleMouseUp = () => {
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
    saveThumbnail();
  };


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

  const handleStageMouseLeave = (_: KonvaEventObject<MouseEvent>) => {
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
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
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

          {/* Remote Ghost Lines */}
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