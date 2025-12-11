import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader, type ActiveUser } from '@/components/BoardHeader';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { useState, useEffect } from 'react';
import { BoardProvider } from '@/contexts/BoardContext';
import { BoardStorage } from "@/utils/boardStorage";
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useHotkeys } from '@/hooks/useHotkeys';

export type Tool = "select" | "pencil" | "rectangle" | "eraser" | "pan" | "text";
export type ToolOptions = {
    strokeType?: 'normal' | 'wobbly' | 'dashed' | 'dotted';
    strokeColor?: string;
    strokeWidth?: number;
    fill?: string;
};

export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');

    const [options, setOptions] = useState<ToolOptions>({ strokeType: 'normal', strokeColor: '#000000', strokeWidth: 1, fill: "transparent" });
    const { boardId } = useParams();
    const navigate = useNavigate();

    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

    const whiteboard = useWhiteboard({
        boardId: boardId!,
        onActiveUsersChange: setActiveUsers,
        tool: tool
    });

    useEffect(() => {
        if (boardId) {
            BoardStorage.update(boardId, {});
        }
    }, [boardId]);

    if (!boardId) {
        navigate('/');
        return null;
    }

    useHotkeys(setTool)

    return (
        <BoardProvider boardId={boardId}>
            <div className="w-full h-screen bg-gray-50 overflow-hidden relative">
                <BoardHeader activeUsers={activeUsers} />
                <Sidebar onUndo={whiteboard.undo} onRedo={whiteboard.redo} tool={tool} setTool={setTool} options={options} setOptions={setOptions} canUndo={whiteboard.canUndo} canRedo={whiteboard.canRedo} />
                <main className="absolute inset-0 w-full h-full z-0">
                    <CanvasArea
                        tool={tool}
                        setTool={setTool}
                        options={options}
                        boardId={boardId}
                        whiteboard={whiteboard}
                    />
                </main>
            </div>
        </BoardProvider>
    );
}