// src/pages/BoardPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { BoardHeader, type ActiveUser } from '@/components/ui/BoardHeader'; // New Header
import { Sidebar } from '@/Sidebar';         // Restored Sidebar
import { CanvasArea } from '@/CanvasArea';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { ShareModal } from '@/components/ui/sharemodal';

export type Tool = "select" | "pencil" | "rectangle";

interface BoardData {
    id: string;
    name: string;
    owner_id: string | null;
    is_public: boolean;
    owner_email?: string;
}

export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');
    const { boardId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    // State
    const [board, setBoard] = useState<BoardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Logic (Keep this exactly as it was)
    useEffect(() => {
        if (!boardId) {
            navigate('/login');
            return;
        }

        if (boardId.startsWith('guest-')) {
            setBoard({
                id: boardId,
                name: 'Guest Session',
                owner_id: null,
                is_public: true,
                owner_email: 'Guest'
            });
            setIsLoading(false);
            return;
        }

        const fetchBoardDetails = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/boards/${boardId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    throw new Error('Board not found or access denied.');
                }

                const data = await res.json();
                setBoard(data);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoardDetails();
    }, [boardId, token, navigate]);


    // Calculate Ownership
    const userId = token ? (jwtDecode(token) as { id: string })?.id : null;
    const isOwner = board?.owner_id === userId;

    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Render States
    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading board...</div>;

    if (error) {
        setTimeout(() => navigate('/boards'), 2000);
        return <div className="flex h-screen items-center justify-center">Error: {error}</div>;
    }

    if (!board) return <div>Board not found</div>;

    return (
        <div className="w-full h-screen bg-gray-50 overflow-hidden">
            <BoardHeader
                boardId={board.id}
                initialName={board.name}
                isOwner={isOwner}
                activeUsers={activeUsers} // 4. Pass users to header
                onShareClick={() => setIsShareOpen(true)} // 5. Handle share click
            />

            <Sidebar tool={tool} setTool={setTool} />

            <main className="w-full h-full">
                <div className="w-full h-full pt-14 pl-16">
                    <CanvasArea
                        tool={tool}
                        boardId={board.id}
                        onActiveUsersChange={setActiveUsers} // 6. Receive users from canvas
                    />
                </div>
            </main>

            {/* 7. Render Share Modal */}
            {isShareOpen && (
                <ShareModal
                    board={board}
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    onBoardUpdate={(updated) => setBoard(prev => ({ ...prev!, ...updated }))}
                />
            )}
        </div>
    );
}