import { Button } from "@/components/ui/button";
import {
  MousePointer2, Square, Pencil, Undo2, Redo2, Eraser,
  Hand, ChevronLeft, ChevronRight
} from "lucide-react";
import type { Tool } from "@/pages/BoardPage";
import { useState } from "react";

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

  const [flyoutOpen, setFlyoutOpen] = useState(false);

  return (
    <>
      {/* DESKTOP WRAPPER */}
      <div className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 items-center z-50 pointer-events-none">

        {/* 1. MAIN SIDEBAR (Sits on top, z-20) */}
        <aside className="relative z-20 flex flex-col items-center gap-y-1 p-2 bg-white border shadow-xl rounded-2xl pointer-events-auto">
          <ToolButton targetTool="select" icon={MousePointer2} />
          <ToolButton targetTool="select" icon={Hand} />
          <ToolButton targetTool="rectangle" icon={Square} />
          <ToolButton targetTool="pencil" icon={Pencil} />
          <ToolButton targetTool="eraser" icon={Eraser} />

          <div className="w-full h-px bg-gray-200 my-1" />

          <Button variant="ghost" size="icon" disabled>
            <Undo2 className="w-5 h-5 text-gray-300" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Redo2 className="w-5 h-5 text-gray-300" />
          </Button>
        </aside>

        {/* 2. FLYOUT MENU (Sits behind, z-10) */}
        <div
          className={`
            absolute top-0 left-full z-10 h-full bg-white border-y border-r shadow-sm rounded-r-xl flex items-center transition-all duration-300 ease-in-out pointer-events-auto 
            ${flyoutOpen ? "w-48 -translate-x-3" : "w-2 -translate-x-3"}`}
        >
          {/* Inner Content (Fades out when closed) */}
          <div className={`w-full pl-4 overflow-hidden transition-opacity duration-200 ${flyoutOpen ? "opacity-100 delay-100" : "opacity-0"}`}>
            <div className="p-4 pl-6 whitespace-nowrap">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tool Options</p>
              <div className="text-sm text-gray-600">Properties panel</div>
            </div>
          </div>

          {/* 3. THE HANDLE BUTTON (Sticks out to the right) */}
          <button
            onClick={() => setFlyoutOpen(!flyoutOpen)}
            className={`
                absolute -right-5 top-1/2 -translate-y-1/2 
                h-12 w-5 bg-white border border-l-0 rounded-r-lg shadow-md 
                flex items-center justify-center cursor-pointer hover:bg-gray-50
                pointer-events-auto transition-opacity duration-300
                ${flyoutOpen ? "opacity-100" : "opacity-100"} 
              `}
          >
            {flyoutOpen ? (
              <ChevronLeft className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>

      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 h-16 px-6 bg-white border shadow-xl rounded-full flex items-center gap-x-4 z-50">
        <ToolButton targetTool="select" icon={MousePointer2} />
        <ToolButton targetTool="rectangle" icon={Square} />
        <ToolButton targetTool="pencil" icon={Pencil} />
      </div>
    </>
  );
}