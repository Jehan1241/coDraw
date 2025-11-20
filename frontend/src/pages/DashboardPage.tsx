// src/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { BoardStorage, type BoardMeta } from "@/utils/boardStorage";

export function DashboardPage() {
    const navigate = useNavigate();
    const [boards, setBoards] = useState<BoardMeta[]>([]);

    useEffect(() => {
        const storedBoards = BoardStorage.getAll();
        if (storedBoards.length === 0) {
            const newId = crypto.randomUUID();
            navigate(`/board/${newId}`, { replace: true });
            return;
        }
        setBoards(storedBoards);
    }, [navigate]);

    const createNewBoard = () => {
        const newId = crypto.randomUUID();
        navigate(`/board/${newId}`);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Delete this board from your history?")) {
            BoardStorage.remove(id);
            setBoards(BoardStorage.getAll()); // Refresh list
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Your Whiteboards</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* New Board Button */}
                    <Button
                        onClick={createNewBoard}
                        variant="outline"
                        className="h-32 border-2 border-dashed border-gray-300 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    >
                        <span className="text-xl font-semibold">+ New Board</span>
                    </Button>

                    {/* Existing Boards */}
                    {boards.map((board) => (
                        <div
                            key={board.id}
                            onClick={() => navigate(`/board/${board.id}`)}
                            className="group relative h-48 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col overflow-hidden" // Increased height to h-48
                        >
                            {/* 1. PREVIEW AREA */}
                            <div className="flex-1 bg-gray-100 relative w-full overflow-hidden">
                                {board.thumbnail ? (
                                    <img
                                        src={board.thumbnail}
                                        alt="Board Preview"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        No Preview
                                    </div>
                                )}
                            </div>

                            {/* 2. FOOTER AREA (Name and Date) */}
                            <div className="p-3 border-t bg-white z-10 relative">
                                <h3 className="font-medium text-sm truncate pr-6">{board.name}</h3>
                                <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(board.lastVisited).toLocaleDateString()}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 hover:bg-white/90 transition-opacity z-20"
                                onClick={(e) => handleDelete(e, board.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {boards.length === 0 && (
                    <div className="text-center mt-12 text-gray-400">
                        No history found. Create a board to get started!
                    </div>
                )}
            </div>
        </div>
    );
}