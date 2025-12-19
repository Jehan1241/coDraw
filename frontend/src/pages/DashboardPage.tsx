import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Plus, LayoutGrid } from "lucide-react";
import { BoardStorage, type BoardMeta } from "@/utils/boardStorage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DashboardPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardMeta[]>([]);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  useEffect(() => {
    const storedBoards = BoardStorage.getAll();
    setBoards(storedBoards);
  }, []);

  const createNewBoard = () => {
    const newId = crypto.randomUUID();
    navigate(`/board/${newId}`);
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setBoardToDelete(id);
  };

  const confirmDelete = () => {
    if (boardToDelete) {
      BoardStorage.remove(boardToDelete);
      setBoards(BoardStorage.getAll());
      setBoardToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8 pb-4 border-b border-border">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your recent whiteboard sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          <button
            onClick={createNewBoard}
            className="group h-60 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-card/50 hover:bg-accent/50 flex flex-col items-center justify-center gap-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <span className="font-semibold text-lg text-muted-foreground group-hover:text-primary transition-colors">
              Create New Board
            </span>
          </button>
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="group relative h-60 bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:border-primary/50 cursor-pointer transition-all flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            >
              <div className="flex-1 bg-muted/30 relative w-full overflow-hidden">
                {board.thumbnail ? (
                  <img
                    src={board.thumbnail}
                    alt="Board Preview"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                    <LayoutGrid className="w-10 h-10 opacity-20" />
                    <span className="text-xs font-medium">No Preview</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md translate-y-2 group-hover:translate-y-0"
                onClick={(e) => requestDelete(e, board.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="p-4 border-t border-border bg-card relative z-10">
                <h3 className="font-semibold text-base truncate text-card-foreground pr-4">
                  {board.name || "Untitled Board"}
                </h3>
                <div className="flex items-center text-xs text-muted-foreground gap-1.5 mt-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(board.lastVisited).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {boards.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-muted-foreground gap-4 animate-in slide-in-from-bottom-4 duration-700">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
              <LayoutGrid className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg">No history found. Start a new session!</p>
          </div>
        )}

        <AlertDialog open={!!boardToDelete} onOpenChange={(open) => !open && setBoardToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the board
                and remove its data from your local storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Board
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}