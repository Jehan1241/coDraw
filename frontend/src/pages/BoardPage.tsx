// src/pages/BoardPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader } from '@/components/ui/BoardHeader';
import { Sidebar } from '@/Sidebar';
import { CanvasArea } from '@/CanvasArea';
import { useState, useEffect } from 'react';
import { BoardProvider } from '@/contexts/BoardContext'; // 1. Import the Provider
import { BoardStorage } from "@/utils/boardStorage";

export type Tool = "select" | "pencil" | "rectangle";

export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');
    const { boardId } = useParams();
    const navigate = useNavigate();

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
        // 2. WRAP EVERYTHING IN THE PROVIDER
        <BoardProvider boardId={boardId}>
            <div className="w-full h-screen bg-gray-50 overflow-hidden">

                {/* Header now works because it's inside BoardProvider */}
                <BoardHeader />

                <Sidebar tool={tool} setTool={setTool} />

                <main className="w-full h-full">
                    <div className="w-full h-full pt-14">
                        <CanvasArea
                            tool={tool}
                            boardId={boardId}
                        />
                    </div>
                </main>
            </div>
        </BoardProvider>
    );
}