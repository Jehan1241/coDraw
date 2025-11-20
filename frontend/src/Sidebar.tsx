// src/components/Sidebar.tsx
import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Pencil, Undo2, Redo2 } from "lucide-react";
import type { Tool } from "@/pages/BoardPage";

interface SidebarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
}

export function Sidebar({ tool, setTool }: SidebarProps) {

  const ToolButton = ({ targetTool, icon: Icon }: { targetTool: Tool, icon: any }) => (
    <Button
      variant={tool === targetTool ? "secondary" : "ghost"}
      size="icon"
      onClick={() => setTool(targetTool)}
      className={tool === targetTool ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : "text-gray-500"}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );

  return (
    <>
      {/* 1. DESKTOP FLOATING SIDEBAR */}
      {/* 'hidden md:flex': Only show on desktop */}
      {/* 'fixed left-4 top-1/2': Pin to left, center vertically */}
      <aside className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 flex-col items-center gap-y-2 p-2 bg-white border shadow-xl rounded-2xl z-50">
        <ToolButton targetTool="select" icon={MousePointer2} />
        <ToolButton targetTool="rectangle" icon={Square} />
        <ToolButton targetTool="pencil" icon={Pencil} />

        <div className="w-full h-px bg-gray-200 my-1" />

        <Button variant="ghost" size="icon" disabled>
          <Undo2 className="w-5 h-5 text-gray-300" />
        </Button>
        <Button variant="ghost" size="icon" disabled>
          <Redo2 className="w-5 h-5 text-gray-300" />
        </Button>
      </aside>

      {/* 2. MOBILE BOTTOM BAR (Unchanged) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 h-16 px-6 bg-white border shadow-xl rounded-full flex items-center gap-x-4 z-50">
        <ToolButton targetTool="select" icon={MousePointer2} />
        <ToolButton targetTool="rectangle" icon={Square} />
        <ToolButton targetTool="pencil" icon={Pencil} />
      </div>
    </>
  );
}