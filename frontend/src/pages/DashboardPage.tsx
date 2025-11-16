// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
// We need to decode the JWT to get the user's ID
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; // Added missing import
import { Share2, Trash2 } from 'lucide-react';
import { ShareModal } from '@/components/ui/sharemodal';

interface Board {
    id: string;
    name: string;
    owner_id: string | null;
    is_public: boolean;
}

interface UserPayload {
    id: string;
    email: string;
}

const Header = () => {
    const { logout } = useAuth();
    // The original Header was a fixed bar at the top
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-sm z-10 flex items-center justify-between px-4">
            <h1 className="text-lg font-semibold">Whiteboard Dashboard</h1>
            <Button onClick={logout} variant="outline" size="sm">
                Logout
            </Button>
        </header>
    );
};

export function DashboardPage() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [boards, setBoards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const API_URL = 'http://localhost:8080/api';
    const [shareModalBoard, setShareModalBoard] = useState<Board | null>(null);

    const handleBoardUpdate = (updatedBoard: Board) => {
        // Update the main list
        setBoards(currentBoards =>
            currentBoards.map(b => (b.id === updatedBoard.id ? updatedBoard : b))
        );
        // ALSO update the board that is currently open in the modal
        setShareModalBoard(updatedBoard);
    };

    const decodedToken = token ? jwtDecode(token) as { id: string, email: string } : null;
    const userId = decodedToken?.id || null;

    const handleDeleteBoard = async (boardId: string) => {
        // 4a. Confirm with the user
        if (!token || !window.confirm("Are you sure you want to permanently delete this board?")) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/boards/${boardId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                // Handle "Forbidden" (not the owner)
                if (res.status === 403) {
                    const data = await res.json();
                    alert(`Delete failed: ${data.error}`);
                } else {
                    throw new Error('Failed to delete board');
                }
            }

            // 4b. On success, trigger a refresh of the board list
            if (res.status === 204) {
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while deleting the board.');
        }
    };


    useEffect(() => {
        let isSubscribed = true; // Cleanup variable to prevent memory leaks

        const fetchBoards = async () => {
            if (!token) {
                if (isSubscribed) setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/boards`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        logout();
                        return;
                    }
                    throw new Error('Failed to fetch boards');
                }

                const data = await res.json();
                if (isSubscribed) {
                    setBoards(data);
                    setLoading(false);
                }

            } catch (error) {
                console.error(error);
                if (isSubscribed) setLoading(false);
            }
        };

        fetchBoards();

        // 2. Cleanup function
        return () => {
            isSubscribed = false;
        };

        // 3. FIX 2: Added 'refreshTrigger' to dependency array
        // This is what forces the fetchBoards function to run after board creation!
    }, [token, logout, refreshTrigger]);
    // 3. New function to navigate to a new board (via API)
    const handleCreateBoard = async () => {
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/boards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                throw new Error('Failed to create board.');
            }

            // FIX 4: Instead of manipulating state, just trigger a reload!
            setRefreshTrigger(prev => prev + 1);

            // Optional: Redirect immediately to the new board
            // const newBoard = await res.json();
            // navigate(`/board/${newBoard.id}`);

        } catch (error) {
            console.error(error);
        }
    }


    if (loading) {
        return <div>Loading your boards...</div>;
    }

    // 4. Component Render
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="pt-20 max-w-4xl mx-auto">
                {/* ... (Header, Create Button) ... */}
                <div className="grid grid-cols-3 gap-4">
                    <Button onClick={handleCreateBoard} className="h-40 border-2 border-dashed">
                        + Create New Board
                    </Button>

                    {boards.map((board) => (
                        <div
                            key={board.id}
                            className="p-4 border bg-white rounded shadow-sm group relative"
                        >
                            <div
                                className="cursor-pointer"
                                onClick={() => navigate(`/board/${board.id}`)}
                            >
                                <p className="font-medium truncate">{board.name}</p>
                                <p className="text-sm text-gray-500">
                                    Owner: {board.owner_id === userId ? 'You' : 'Other'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {/* 7. Show public/private status */}
                                    Status: {board.is_public ? "Public" : "Private"}
                                </p>
                            </div>

                            {/* 8. SHARE AND DELETE BUTTONS (Only for owner) */}
                            {board.owner_id === userId && (
                                <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-400 hover:text-blue-500 hover:bg-blue-100"
                                        onClick={() => setShareModalBoard(board)} // Open modal
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBoard(board.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {boards.length === 0 && <p>No boards found. Create one above!</p>}
                </div>
            </div>

            {/* 9. RENDER THE MODAL */}
            {shareModalBoard && (
                <ShareModal
                    board={shareModalBoard}
                    isOpen={!!shareModalBoard}
                    onClose={() => setShareModalBoard(null)}
                    onBoardUpdate={handleBoardUpdate}
                />
            )}
        </div>
    );
}