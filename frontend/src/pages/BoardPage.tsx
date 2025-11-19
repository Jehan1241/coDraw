// src/pages/BoardPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader } from '@/components/ui/BoardHeader';
import { Sidebar } from '@/Sidebar';
import { CanvasArea } from '@/CanvasArea';
import { useState } from 'react';
// Removed useAuth, jwtDecode

export type Tool = "select" | "pencil" | "rectangle";

export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');
    const { boardId } = useParams();
    const navigate = useNavigate();

    // In local-first mode, we don't fetch board metadata. 
    // The board exists simply because you visited the URL.

    if (!boardId) {
        navigate('/');
        return null;
    }

    return (
        <div className="w-full h-screen bg-gray-50 overflow-hidden">
            <BoardHeader
                boardId={boardId}
            />

            <Sidebar tool={tool} setTool={setTool} />

            <main className="w-full h-full">
                <div className="w-full h-full pt-14 pl-0 md:pl-16">
                    <CanvasArea
                        tool={tool}
                        boardId={boardId}
                    // We removed the onActiveUsersChange prop in the last step to simplify, 
                    // but if you kept it in CanvasArea, pass the handler here.
                    />
                </div>
            </main>
        </div>
    );
}