// src/components/BoardHeader.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Moon, Share2, Sun } from "lucide-react";
import { useBoard } from "@/contexts/BoardContext";
import { ShareModal } from "@/components/ui/ShareModal"; // Import the new modal
import { useTheme } from "./ui/theme-provider";

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
  const { setTheme, theme } = useTheme()

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
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-background text-foreground p-1.5 rounded-xl shadow-sm border">

        {/* CoDraw Badge - Floating on the top edge */}
        <div className="absolute -top-2.5 left-3 bg-foreground text-background text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-sm z-50 pointer-events-none select-none tracking-widest uppercase">
          CoDraw
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>


        {isEditingBoardName ? (
          <Input
            className="h-7 w-48 text-sm font-medium border-none shadow-none focus-visible:ring-0 px-2 "
            value={tempBoardName}
            onChange={(e) => setTempBoardName(e.target.value)}
            onBlur={handleBoardNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleBoardNameSave()}
            autoFocus
          />
        ) : (
          <h1
            className="text-sm font-medium  px-2 py-1 rounded-md hover:bg-accent cursor-pointer transition-colors max-w-[200px] truncate select-none"
            onClick={() => setIsEditingBoardName(true)}
            title="Rename Board"
          >
            {boardName}
          </h1>
        )}
      </div>

      {/* --- RIGHT ISLAND: Avatars & Share --- */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background p-1.5 rounded-xl shadow-sm border select-none">

        {/* Avatar Stack */}
        <div className="flex -space-x-2 mr-1">
          {activeUsers.slice(0, 4).map((u) => (
            <div
              key={u.clientId}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
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


        {/* Theme Toggle (UI Only) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-full"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button
          size="sm"
          variant={"ghost"}
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
