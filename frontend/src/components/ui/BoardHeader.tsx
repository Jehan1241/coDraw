// client/src/components/BoardHeader.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

// 1. NEW: Define User Interface
export interface ActiveUser {
    clientId: number;
    name: string;
    color: string;
}

interface BoardHeaderProps {
    boardId: string;
    initialName: string;
    isOwner: boolean;
    activeUsers: ActiveUser[]; // 2. Accept active users list
    onShareClick: () => void;  // 3. Accept share click handler
}

export function BoardHeader({ boardId, initialName, isOwner, activeUsers, onShareClick }: BoardHeaderProps) {
    const navigate = useNavigate();
    const { token, logout } = useAuth();

    const [name, setName] = useState(initialName);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setName(initialName);
    }, [initialName]);

    const handleRename = async () => {
        if (name === initialName || name.trim() === "") {
            setName(initialName);
            setIsEditing(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/boards/${boardId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error("Failed to rename");
            toast.success("Board renamed");
        } catch (error) {
            console.error(error);
            toast.error("Failed to rename board");
            setName(initialName);
        } finally {
            setIsEditing(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center px-4 z-50 justify-between">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" onClick={() => navigate('/boards')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                {isEditing && isOwner ? (
                    <Input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="h-8 font-semibold text-lg max-w-sm"
                    />
                ) : (
                    <h1
                        className={`text-lg font-semibold px-2 py-1 rounded truncate max-w-[200px] ${isOwner ? 'hover:bg-gray-100 cursor-pointer' : ''}`}
                        onClick={() => isOwner && setIsEditing(true)}
                        title={name}
                    >
                        {name}
                    </h1>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* 4. NEW: Render the Avatar Stack */}
                <div className="flex -space-x-2 mr-4">
                    {activeUsers.map((user) => (
                        <div
                            key={user.clientId}
                            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: user.color }}
                            title={user.name}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                </div>

                {/* 5. Share Button (Only if owner) */}
                {isOwner && (
                    <Button variant="outline" size="sm" onClick={onShareClick} className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                )}

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Logout
                </Button>
            </div>
        </header>
    );
}