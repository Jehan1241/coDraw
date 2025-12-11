import { useUser } from "@/contexts/UserContext";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import type { ActiveUser } from "@/components/BoardHeader";
import type { Tool } from "@/pages/BoardPage";

interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
  tool: Tool
}

export type SyncedShape = {
  id: string;
  type: "line" | "rect" | "text";

  // Common Transform Props (Used by Rect & Text)
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;

  // Common Style Props
  strokeColor?: string;
  strokeWidth?: number;
  strokeType?: string; // 'solid' | 'dashed' | 'wobbly'
  fill?: string;       // Color string or "transparent"

  // Line Specific
  points?: number[];

  // Rect Specific
  width?: number;
  height?: number;

  // Text Specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: string;      // 'left' | 'center' | 'right'
  lineHeight?: number;
};


export interface GhostShapeData {
  type?: string;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeType?: string;
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

interface useWhiteboardProps {
  boardId: string;
  onActiveUsersChange?: (users: ActiveUser[]) => void;
  tool: Tool
}

export function useWhiteboard({ boardId, onActiveUsersChange, tool }: useWhiteboardProps) {
  const { user } = useUser();
  const userRef = useRef(user);

  const toolRef = useRef(tool);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) undoManagerRef.current?.redo();
        else undoManagerRef.current?.undo();
      }
      if (isCmdOrCtrl && e.key === 'y') {
        e.preventDefault();
        undoManagerRef.current?.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoManagerRef.current]);

  useEffect(() => {
    const manager = undoManagerRef.current;
    if (!manager) return;
    const updateStack = () => {
      setCanUndo(manager.undoStack.length > 0);
      setCanRedo(manager.redoStack.length > 0);
    };
    manager.on('stack-item-added', updateStack);
    manager.on('stack-item-popped', updateStack);
    updateStack();
    return () => {
      manager.off('stack-item-added', updateStack);
      manager.off('stack-item-popped', updateStack);
    };
  }, [undoManagerRef.current]);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  const throttledSetAwareness = useRef(
    throttle((x: number | null, y: number | null, shapeData: GhostShapeData | null) => {
      const payload: any = {};
      if (x !== null && y !== null) payload.cursor = { x, y };
      if (shapeData) payload.drawing = shapeData;
      else payload.drawing = null;
      payload.tool = toolRef.current;

      if (Object.keys(payload).length > 0) {
        providerRef.current?.setAwarenessField("user", {
          name: userRef.current.name,
          color: userRef.current.color,
          ...payload,
        });
      }
    }, 30),
  ).current;


  const [cursors, setCursors] = useState(new Map<number, CursorData>());
  const [smoothCursors, setSmoothCursors] = useState(
    new Map<number, CursorData>(),
  );
  const animationRef = useRef(0);
  const smoothingFactor = 0.2;

  useEffect(() => {
    function animate() {
      setSmoothCursors((prev) => {
        const updated = new Map(prev);
        const currentCursors = cursors;

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

  const [yjsShapesMap, setYjsShapesMap] = useState<Y.Map<SyncedShape> | null>(
    null,
  );
  const [syncedShapes, setSyncedShapes] = useState<SyncedShape[]>([]);
  const [remoteLines, setRemoteLines] = useState(new Map<number, GhostShapeData>());

  useEffect(() => {
    const ydoc = new Y.Doc();
    const yMap = ydoc.getMap<SyncedShape>("shapes");
    undoManagerRef.current = new Y.UndoManager(yMap);

    const localProvider = new IndexeddbPersistence(boardId, ydoc);
    localProvider.on("synced", () => {
      setSyncedShapes(Array.from(yMap.values()));
    });

    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:1234";

    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: boardId,
      document: ydoc,
    });

    // 6. FIX: Use userRef for initial setup
    provider.setAwarenessField("user", {
      name: userRef.current.name,
      color: userRef.current.color,
      tool: toolRef.current
    });

    providerRef.current = provider;
    setYjsShapesMap(yMap);

    const onSync = () => setSyncedShapes(Array.from(yMap.values()));
    yMap.observe(onSync);

    const onAwarenessUpdate = () => {
      const newCursors = new Map<number, CursorData>();
      const newRemoteLines = new Map<number, GhostShapeData>();
      const activeUsersList: ActiveUser[] = [];

      if (!provider.awareness) return;

      const states = provider.awareness.getStates();

      states.forEach((state, clientID) => {
        if (state.user) {
          activeUsersList.push({
            clientId: clientID,
            name: state.user.name,
            color: state.user.color,
          });

          if (!provider.awareness) return;

          if (clientID !== provider.awareness.clientID) {
            if (state.user.cursor?.x != null && state.user.cursor?.y != null) {
              newCursors.set(clientID, {
                x: state.user.cursor.x,
                y: state.user.cursor.y,
                name: state.user.name,
                color: state.user.color,
                tool: state.user.tool || 'select'
              });
            }
            if (state.user.drawing) {
              newRemoteLines.set(clientID, state.user.drawing);
            }
          }
        }
      });
      setCursors(newCursors);
      setRemoteLines(newRemoteLines);
      if (onActiveUsersChange) onActiveUsersChange(activeUsersList);
    };
    provider.on("awarenessUpdate", onAwarenessUpdate);

    return () => {
      provider.destroy();
      yMap.unobserve(onSync);
      providerRef.current = null;
    };
  }, [boardId, onActiveUsersChange]);

  return {
    yjsShapesMap,
    remoteLines,
    smoothCursors,
    syncedShapes,
    throttledSetAwareness,
    undo: () => undoManagerRef.current?.undo(),
    redo: () => undoManagerRef.current?.redo(),
    canUndo,
    canRedo,
  };
}
