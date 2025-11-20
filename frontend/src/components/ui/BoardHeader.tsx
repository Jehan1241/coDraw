// src/components/BoardHeader.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Share2, UserPen } from 'lucide-react';
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
// 1. IMPORT BoardContext hook
import { useBoard } from "@/contexts/BoardContext";

// 2. REMOVE Props Interface (We don't need props anymore)

export function BoardHeader() {
    const navigate = useNavigate();
    const { user, updateName } = useUser();

    // 3. GET BOARD DATA FROM CONTEXT
    const { boardName, renameBoard } = useBoard();

    const [isEditingName, setIsEditingName] = useState(false);
    const [tempUserName, setTempUserName] = useState(user.name);

    // Board Name Editing State
    const [isEditingBoardName, setIsEditingBoardName] = useState(false);
    const [tempBoardName, setTempBoardName] = useState(boardName);

    // Sync local board name when remote changes
    useEffect(() => {
        setTempBoardName(boardName);
    }, [boardName]);

    // --- Handlers ---

    const handleUserNameSave = () => {
        if (tempUserName.trim()) {
            updateName(tempUserName);
        } else {
            setTempUserName(user.name);
        }
        setIsEditingName(false);
    };

    const handleBoardNameSave = () => {
        if (tempBoardName.trim()) {
            renameBoard(tempBoardName); // Updates Y.js -> Syncs to everyone
        } else {
            setTempBoardName(boardName);
        }
        setIsEditingBoardName(false);
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center px-4 z-50 justify-between">

            {/* LEFT SIDE: Back Button & Board Name */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                {/* Board Name Editor */}
                {isEditingBoardName ? (
                    <Input
                        className="h-8 w-48 font-semibold text-lg"
                        value={tempBoardName}
                        onChange={(e) => setTempBoardName(e.target.value)}
                        onBlur={handleBoardNameSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleBoardNameSave()}
                        autoFocus
                    />
                ) : (
                    <h1
                        className="text-lg font-semibold text-gray-700 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => setIsEditingBoardName(true)}
                        title="Rename Board"
                    >
                        {boardName}
                    </h1>
                )}
            </div>

            {/* RIGHT SIDE: User & Share */}
            <div className="flex items-center gap-3">

                {/* User Name Editor */}
                <div className="flex items-center mr-2">
                    {isEditingName ? (
                        <Input
                            className="h-8 w-32 text-sm"
                            value={tempUserName}
                            onChange={(e) => setTempUserName(e.target.value)}
                            onBlur={handleUserNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleUserNameSave()}
                            autoFocus
                        />
                    ) : (
                        <div
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-sm font-medium text-gray-700"
                            onClick={() => { setTempUserName(user.name); setIsEditingName(true); }}
                            title="Rename Yourself"
                        >
                            <div className="w-2 h-2 rounded-full" style={{ background: user.color }} />
                            {user.name}
                            <UserPen className="w-3 h-3 text-gray-400" />
                        </div>
                    )}
                </div>

                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </div>
        </header>
    );
}