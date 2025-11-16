import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Pencil } from "lucide-react"; // Import icons
import type { Tool } from "./App";

interface SidebarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
}

export function Sidebar({ tool, setTool }: SidebarProps) {
  return (
    <aside className="fixed top-16 left-0 w-16 h-[calc(100vh-4rem)] bg-gray-50 border-r flex flex-col items-center py-4 gap-y-2">
      <Button onClick={() => setTool("select")} variant="ghost" size="icon">
        <MousePointer2 className="w-5 h-5" />
      </Button>
      <Button onClick={() => setTool("rectangle")} variant="ghost" size="icon">
        <Square className="w-5 h-5" />
      </Button>
      <Button onClick={() => setTool("pencil")} variant="ghost" size="icon">
        <Pencil className="w-5 h-5" />
      </Button>
    </aside>
  );
}