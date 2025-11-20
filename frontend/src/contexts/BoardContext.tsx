// src/contexts/BoardContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BoardStorage } from '@/utils/boardStorage';

interface BoardContextType {
    ydoc: Y.Doc;
    provider: HocuspocusProvider | null;
    boardId: string;
    boardName: string;
    renameBoard: (name: string) => void;
    status: 'loading' | 'connected' | 'disconnected';
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children, boardId }: { children: React.ReactNode; boardId: string }) {
    const [ydoc] = useState(() => new Y.Doc());
    const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
    const [boardName, setBoardName] = useState("Untitled Board");
    const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');

    useEffect(() => {
        // 1. Setup Persistence (Browser)
        const localProvider = new IndexeddbPersistence(boardId, ydoc);

        // 2. Setup Network (Hocuspocus)
        const networkProvider = new HocuspocusProvider({
            url: "ws://localhost:1234",
            name: boardId,
            document: ydoc,
        });

        setProvider(networkProvider);

        // 3. Handle Name Syncing
        const metaMap = ydoc.getMap<string>("meta");

        const updateName = () => {
            const name = metaMap.get("name");
            if (name) {
                setBoardName(name);
                // Also update our local dashboard list
                BoardStorage.update(boardId, { name });
            }
        };

        // Listen for remote changes
        metaMap.observe(updateName);

        // Initial load logic
        localProvider.on('synced', () => {
            // If we loaded a name from local storage, use it.
            // If the doc is empty, set default.
            if (!metaMap.has("name")) {
                // Check if we have a name in our local dashboard index to migrate
                const existingLocalName = BoardStorage.getName(boardId);
                metaMap.set("name", existingLocalName || "Untitled Board");
            }
            updateName();
            setStatus('connected');
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
        <BoardContext.Provider value={{ ydoc, provider, boardId, boardName, renameBoard, status }}>
            {children}
        </BoardContext.Provider>
    );
}

export function useBoard() {
    const context = useContext(BoardContext);
    if (!context) throw new Error("useBoard must be used within a BoardProvider");
    return context;
}