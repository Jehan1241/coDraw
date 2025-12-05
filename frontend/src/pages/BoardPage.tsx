// src/pages/BoardPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader, type ActiveUser } from '@/components/BoardHeader';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { useState, useEffect } from 'react';
import { BoardProvider } from '@/contexts/BoardContext';
import { BoardStorage } from "@/utils/boardStorage";

export type Tool = "select" | "pencil" | "rectangle" | "eraser" | "pan";

export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');
    const { boardId } = useParams();
    const navigate = useNavigate();

    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

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
                <BoardHeader activeUsers={activeUsers} />
                <Sidebar tool={tool} setTool={setTool} />
                <main className="absolute inset-0 w-full h-full z-0">
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