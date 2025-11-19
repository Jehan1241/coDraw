// src/components/BoardHeader.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';
import { toast } from "sonner";

interface BoardHeaderProps {
    boardId: string;
}

export function BoardHeader({ boardId }: BoardHeaderProps) {
    const navigate = useNavigate();

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center px-4 z-50 justify-between">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <h1 className="text-lg font-semibold px-2 py-1 rounded text-gray-700">
                    Board: <span className="font-normal text-gray-500 text-sm">{boardId}</span>
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Link
                </Button>
            </div>
        </header>
    );
}