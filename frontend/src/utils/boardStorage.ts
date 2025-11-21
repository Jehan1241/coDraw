// src/utils/boardStorage.ts

export interface BoardMeta {
    id: string;
    name: string;
    lastVisited: number;
    thumbnail?: string;
}

const STORAGE_KEY = "whiteboard_local_index";

export const BoardStorage = {
    // Get all boards, sorted by recent
    getAll: (): BoardMeta[] => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const list: BoardMeta[] = JSON.parse(raw);
            return list.sort((a, b) => b.lastVisited - a.lastVisited);
        } catch {
            return [];
        }
    },

    // Add or Update a board
    update: (id: string, updates: Partial<BoardMeta>) => {
        const list = BoardStorage.getAll();
        const index = list.findIndex((b) => b.id === id);

        if (index === -1) {
            list.push({
                id,
                name: updates.name || "Untitled Board",
                lastVisited: Date.now(),
            });
        } else {
            list[index] = { ...list[index], ...updates, lastVisited: Date.now() };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    },

    // Get specific board name
    getName: (id: string): string => {
        const list = BoardStorage.getAll();
        const board = list.find((b) => b.id === id);
        return board ? board.name : "Untitled Board";
    },

    // Delete board
    remove: (id: string) => {
        const list = BoardStorage.getAll().filter((b) => b.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

        // Also attempt to delete the actual heavy Y.js data from IndexedDB
        // The default y-indexeddb name format is just the room name (boardId)
        window.indexedDB.deleteDatabase(id);
    }
};