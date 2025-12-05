import { Button } from "@/components/ui/button";
import {
  MousePointer2, Square, Pencil, Undo2, Redo2, Eraser, Hand,
  Pipette
} from "lucide-react";
import type { Tool } from "@/pages/BoardPage";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Flybar } from "./Flybar";
import { Input } from "../ui/input";

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
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const STROKE_TYPES = [
    {
      id: 'normal',
      label: 'Solid',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {/* Crisp, perfect geometric circle */}
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    },
    {
      id: 'wobbly',
      label: 'Wobbly',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          {/* Variable thickness "Brush Stroke" Circle */}
          {/* This path creates an outer circle (r=10) and an inner off-center circle to create the thickness effect */}
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      )
    },
    {
      id: 'dashed',
      label: 'Dashed',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" strokeDasharray="6 4" />
        </svg>
      )
    },
    {
      id: 'dotted',
      label: 'Dotted',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" strokeDasharray="1 3" strokeLinecap="round" />
        </svg>
      )
    }
  ];

  const COLORS = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ea580c', '#64748b', '#AF4562', '#10b981', '#f43f5e', '#8bAcf6'];

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

        <Flybar flyoutOpen={flyoutOpen} setFlyoutOpen={setFlyoutOpen}>
          <div className="flex gap-1 flex-col">
            <p className="text-xs text-muted-foreground">Stroke Width</p>
            <div className="flex gap-2">
              <div><Button variant={"outline"} className="w-8 h-8">S</Button></div>
              <div><Button variant={"outline"} className="w-8 h-8">M</Button></div>
              <div><Button variant={"outline"} className="w-8 h-8">L</Button></div>
              <div><Button variant={"outline"} className="w-8 h-8">XL</Button></div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Stroke Style</p>
            <div className="flex gap-2">
              {STROKE_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="icon"
                  className={`w-8 h-8 rounded-md transition-all`}
                  title={type.label}
                >
                  {type.icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Color</p>
              <div className="text-[10px] font-mono text-gray-500"></div>
            </div>

            {/* Preset Grid */}
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full`}
                  style={{ backgroundColor: c }}

                />
              ))}
            </div>
            <div className="flex justify-between items-center gap-2 mt-1 mr-2">
              <p className="text-xs text-muted-foreground">Hex</p>
              <Input className="h-7"></Input>
            </div>
          </div>

        </Flybar>


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