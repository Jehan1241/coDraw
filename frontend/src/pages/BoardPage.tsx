import { useNavigate, useParams } from 'react-router-dom';
import { Topbar } from '@/Menu';
import { Sidebar } from '@/Sidebar';
import { CanvasArea } from '@/CanvasArea';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type Tool = "select" | "pencil" | "rectangle"

interface BoardData {
    id: string;
    name: string;
}


export function BoardPage() {
    const [tool, setTool] = useState<Tool>('select');
    const { boardId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [board, setBoard] = useState<BoardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        if (!boardId) {
            navigate('/login'); // This is fine
            return;
        }

        // 1. REMOVED all 'if (token)' or 'if (boardId.startsWith...)' logic.
        // We just fetch. The token will be null or real. The backend will decide.

        const fetchBoardDetails = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/boards/${boardId}`, {
                    headers: {
                        // This is perfect. It will send 'Bearer null' for guests
                        // or 'Bearer <token>' for users.
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    // The backend (which we just fixed) will correctly send a 404
                    // if a guest tries to access a private board.
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


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading board...</div>;
    }

    if (error) {
        // The fetch failed (404, 403). Redirect to dashboard.
        // We use a timeout to let the user briefly see the message.
        setTimeout(() => navigate('/boards'), 1000);
        return (
            <div className="flex h-screen items-center justify-center">
                Error: {error} Redirecting...
            </div>
        );
    }

    if (!board) {
        // This should not happen, but it's a good fallback
        return <div>Board not found.</div>;
    }

    if (!boardId) {
        return <div>Error: No board ID found.</div>;
    }

    return (
        <div className="w-full h-screen">
            <Topbar />
            <Sidebar tool={tool} setTool={setTool} />
            <main className="w-full h-full">
                <div className="w-full h-full pt-16 pl-16">
                    <CanvasArea tool={tool} boardId={boardId} />
                </div>
            </main>
        </div>
    );
}