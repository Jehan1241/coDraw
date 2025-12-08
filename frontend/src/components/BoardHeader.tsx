// src/components/BoardHeader.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Moon, Share2, Sun } from "lucide-react";
import { useBoard } from "@/contexts/BoardContext";
import { ShareModal } from "@/components/ui/ShareModal"; // Import the new modal

export interface ActiveUser {
  clientId: number;
  name: string;
  color: string;
}

interface BoardHeaderProps {
  activeUsers: ActiveUser[];
  // We don't need onShareClick prop anymore, we handle it internally
}

export function BoardHeader({ activeUsers }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { boardName, renameBoard } = useBoard();

  const [isShareOpen, setIsShareOpen] = useState(false);

  // Board Name Editing State
  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [tempBoardName, setTempBoardName] = useState(boardName);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setTempBoardName(boardName);
  }, [boardName]);

  const handleBoardNameSave = () => {
    if (tempBoardName.trim()) renameBoard(tempBoardName);
    else setTempBoardName(boardName);
    setIsEditingBoardName(false);
  };

  return (
    <>
      {/* --- LEFT ISLAND: Navigation & Title --- */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">

        {/* CoDraw Badge - Floating on the top edge */}
        <div className="absolute -top-2.5 left-3 bg-zinc-900 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full border-2 border-white shadow-sm z-50 pointer-events-none select-none tracking-widest uppercase">
          CoDraw
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-600"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        {isEditingBoardName ? (
          <Input
            className="h-7 w-48 text-sm font-medium border-none shadow-none focus-visible:ring-0 px-2 text-gray-900 placeholder:text-gray-400"
            value={tempBoardName}
            onChange={(e) => setTempBoardName(e.target.value)}
            onBlur={handleBoardNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleBoardNameSave()}
            autoFocus
          />
        ) : (
          <h1
            className="text-sm font-medium text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors max-w-[200px] truncate select-none"
            onClick={() => setIsEditingBoardName(true)}
            title="Rename Board"
          >
            {boardName}
          </h1>
        )}
      </div>

      {/* --- RIGHT ISLAND: Avatars & Share --- */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border">

        {/* Avatar Stack */}
        <div className="flex -space-x-2 mr-1">
          {activeUsers.slice(0, 4).map((u) => (
            <div
              key={u.clientId}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-gray-100"
              style={{ backgroundColor: u.color }}
              title={u.name}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {activeUsers.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 ring-1 ring-gray-100">
              +{activeUsers.length - 4}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-gray-200 mx-1" />

        {/* Theme Toggle (UI Only) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="h-8 w-8 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
        >
          {isDarkMode ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <Button
          size="sm"
          onClick={() => setIsShareOpen(true)}
          className="text-xs"
        >
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </div>

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </>
  );
}
