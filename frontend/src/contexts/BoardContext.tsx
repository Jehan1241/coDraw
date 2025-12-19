import React, { createContext, useContext, useEffect, useState } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import { BoardStorage } from "@/utils/boardStorage";

interface BoardContextType {
  ydoc: Y.Doc;
  provider: HocuspocusProvider | null;
  boardId: string;
  boardName: string;
  renameBoard: (name: string) => void;
  status: "loading" | "connected" | "disconnected";
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({
  children,
  boardId,
}: {
  children: React.ReactNode;
  boardId: string;
}) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [boardName, setBoardName] = useState("Untitled Board");
  const [status, setStatus] = useState<
    "loading" | "connected" | "disconnected"
  >("loading");

  useEffect(() => {
    const localProvider = new IndexeddbPersistence(boardId, ydoc);
    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:1234";

    console.log("connecting to", WS_URL);

    const networkProvider = new HocuspocusProvider({
      url: WS_URL,
      name: boardId,
      document: ydoc,
    });

    setProvider(networkProvider);
    const metaMap = ydoc.getMap<string>("meta");

    const updateName = () => {
      const name = metaMap.get("name");
      if (name) {
        setBoardName(name);
        BoardStorage.update(boardId, { name });
      }
    };

    metaMap.observe(updateName);

    localProvider.on("synced", () => {
      if (!metaMap.has("name")) {
        const existingLocalName = BoardStorage.getName(boardId);
        metaMap.set("name", existingLocalName || "Untitled Board");
      }
      updateName();
      setStatus("connected");
    });

    return () => {
      networkProvider.destroy();
      localProvider.destroy();
      metaMap.unobserve(updateName);
    };
  }, [boardId, ydoc]);

  const renameBoard = (name: string) => {
    const metaMap = ydoc.getMap<string>("meta");
    metaMap.set("name", name);
  };

  return (
    <BoardContext.Provider
      value={{ ydoc, provider, boardId, boardName, renameBoard, status }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) throw new Error("useBoard must be used within a BoardProvider");
  return context;
}
