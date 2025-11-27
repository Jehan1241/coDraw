// src/utils/boardStorage.ts

export interface BoardMeta {
    id: string;
    name: string;
    lastVisited: number;
    thumbnail?: string;
    viewport?: {
        x: number;
        y: number;
        scale: number;
    };
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

    getById: (id: string): BoardMeta | undefined => {
        const list = BoardStorage.getAll();
        return list.find((b) => b.id === id);
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
                ...updates
            });
        } else {
            list[index] = { ...list[index], ...updates, lastVisited: Date.now() };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    },

    getName: (id: string): string => {
        const list = BoardStorage.getAll();
        const board = list.find((b) => b.id === id);
        return board ? board.name : "Untitled Board";
    },

    remove: (id: string) => {
        const list = BoardStorage.getAll().filter((b) => b.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.indexedDB.deleteDatabase(id);
    }
};