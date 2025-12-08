import { useUser } from "@/contexts/UserContext";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import type { ActiveUser } from "@/components/BoardHeader";

interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
}

export type SyncedShape = {
  id: string;
  type: "line" | "rect";
  // Line props
  points?: number[];
  strokeColor?: string;
  strokeWidth?: number;
  strokeType?: string
  // Rect props
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
};


export interface GhostShapeData {
  type?: string;
  points?: number[]; // Make optional
  x?: number;        // Add x
  y?: number;        // Add y
  width?: number;    // Add width
  height?: number;   // Add height
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
}

export function useWhiteboard({
  boardId,
  onActiveUsersChange,
}: useWhiteboardProps) {
  const { user } = useUser();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const throttledSetAwareness = useRef(
    throttle((x: number | null, y: number | null, shapeData: GhostShapeData | null) => {
      const payload: any = {};
      if (x !== null && y !== null) payload.cursor = { x, y };
      if (shapeData) payload.drawing = shapeData;
      else payload.drawing = null;

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

  const [yjsShapesMap, setYjsShapesMap] = useState<Y.Map<SyncedShape> | null>(
    null,
  );
  const [syncedShapes, setSyncedShapes] = useState<SyncedShape[]>([]);
  const [remoteLines, setRemoteLines] = useState(new Map<number, GhostShapeData>());

  useEffect(() => {
    const ydoc = new Y.Doc();
    const yMap = ydoc.getMap<SyncedShape>("shapes");

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
  };
}
