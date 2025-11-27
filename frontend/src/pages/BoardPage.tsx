// src/pages/BoardPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
// 1. FIX: Import ActiveUser type (assuming it's exported from Header or Canvas)
// If it's not exported, we can define it here or import from where you defined it.
import { BoardHeader, type ActiveUser } from '@/components/ui/BoardHeader';
import { Sidebar } from '@/components/ui/Sidebar';
import { CanvasArea } from '@/components/ui/CanvasArea';
import { useState, useEffect } from 'react';
import { BoardProvider } from '@/contexts/BoardContext';
import { BoardStorage } from "@/utils/boardStorage";

export type Tool = "select" | "pencil" | "rectangle";

export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');
    const { boardId } = useParams();
    const navigate = useNavigate();

    // 2. NEW: State to lift the user list up
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

    // Auto-Register Board in History
    useEffect(() => {
        if (boardId) {
            BoardStorage.update(boardId, {});
        }
    }, [boardId]);

    if (!boardId) {
        navigate('/');
        return null;
    }

    return (
        <BoardProvider boardId={boardId}>
            <div className="w-full h-screen bg-gray-50 overflow-hidden relative">

                {/* 3. FIX: Pass the user list to the Header */}
                <BoardHeader activeUsers={activeUsers} />

                <Sidebar tool={tool} setTool={setTool} />

                <main className="absolute inset-0 w-full h-full z-0">
                    {/* 4. FIX: Pass the setter to the Canvas */}
                    <CanvasArea
                        tool={tool}
                        boardId={boardId}
                        onActiveUsersChange={setActiveUsers}
                    />
                </main>
            </div>
        </BoardProvider>
    );
}