import { Button } from "@/components/ui/button";
import {
  MousePointer2, Square, Pencil, Undo2, Redo2, Eraser, Hand,
} from "lucide-react";
import type { Tool, ToolOptions } from "@/pages/BoardPage";
import { useState } from "react";
import { Flybar } from "./Flybar";
import { Input } from "../ui/input";
import { getDisplayColor } from "../CanvasArea";
import { useTheme } from "../ui/theme-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SidebarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  options: ToolOptions;
  setOptions: (opts: ToolOptions) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}


const toolTipText = { select: "Select", pan: "Pan", rectangle: "Rectangle", pencil: "Pencil", eraser: "Eraser" }



export function Sidebar({ tool, setTool, options, setOptions, onUndo, onRedo, canRedo, canUndo }: SidebarProps) {

  const ToolButton = ({ targetTool, icon: Icon }: { targetTool: Tool, icon: any }) => (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <Button
          variant={tool === targetTool ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setTool(targetTool)}
          className={tool === targetTool ? "bg-accent" : "text-foreground /60"}
        >
          <Icon className="w-5 h-5" />
        </Button >
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{toolTipText[targetTool]}</p>
      </TooltipContent>
    </Tooltip>
  );



  // 1. STATE: Track if we are editing the Border color or Fill color
  const [activeColorMode, setActiveColorMode] = useState<'border' | 'fill'>('border');
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const { theme } = useTheme();

  const STROKE_WIDTHS = [
    { id: 'small', label: 'S', value: 1 },
    { id: 'medium', label: 'M', value: 2 },
    { id: 'large', label: 'L', value: 4 },
    { id: 'xlarge', label: 'XL', value: 8 },
  ];

  const STROKE_TYPES = [
    {
      id: 'normal',
      label: 'Solid',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    },
    {
      id: 'wobbly',
      label: 'Wobbly',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
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

  const COLORS = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ea580c', '#64748b', '#AF4562', '#10b981', '#f43f5e',];

  // 2. HELPER: Get the color value for the currently active mode
  // If fill is undefined or boolean false, treat it as "transparent" string
  const activeColorValue = activeColorMode === 'border'
    ? options.strokeColor
    : (typeof options.fill === 'string' ? options.fill : 'transparent');

  // 3. LOGIC: Update the correct property based on mode
  const handleColorChange = (newColor: string) => {
    if (activeColorMode === 'border') {
      setOptions({ ...options, strokeColor: newColor });
    } else {
      setOptions({ ...options, fill: newColor });
    }
  };

  return (
    <>
      {/* DESKTOP WRAPPER */}
      <div className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 items-center z-50 pointer-events-none select-none">

        {/* 1. MAIN SIDEBAR (Sits on top, z-20) */}
        <aside className="relative z-20 flex flex-col items-center gap-y-1 p-2 bg-background border shadow-xl rounded-2xl pointer-events-auto">
          <ToolButton targetTool="select" icon={MousePointer2} />
          <ToolButton targetTool="pan" icon={Hand} />
          <ToolButton targetTool="rectangle" icon={Square} />
          <ToolButton targetTool="pencil" icon={Pencil} />
          <ToolButton targetTool="eraser" icon={Eraser} />

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="w-5 h-5 " />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="w-5 h-5 " />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>


        </aside>

        <Flybar flyoutOpen={flyoutOpen} setFlyoutOpen={setFlyoutOpen}>
          <div className="flex gap-2 flex-col">
            <p className="text-xs text-muted-foreground">Stroke Width</p>
            <div className="flex gap-2">
              {STROKE_WIDTHS.map((width) => (<Button key={width.id} variant={"outline"} className={`w-8 h-8 ${options.strokeWidth == width.value ? ("dark:bg-accent bg-accent") : ("")}`} onClick={() => { setOptions({ ...options, strokeWidth: width.value }) }}>{width.label}</Button>))}
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
                  onClick={() => { setOptions({ ...options, strokeType: type.id as ToolOptions["strokeType"] }) }}
                  className={`w-8 h-8 ${options.strokeType === type.id ? ("dark:bg-accent bg-accent") : ("")}`}
                  title={type.label}
                >
                  {type.icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* 4. MODE TOGGLE: BORDER vs FILL */}
            <div className="flex gap-2 items-center">
              <p className="text-xs text-muted-foreground">Color</p>
              <Button
                variant={"outline"}
                onClick={() => { setActiveColorMode("border") }}
                className={`h-6 text-xs ${activeColorMode === 'border' ? "dark:bg-accent bg-accent" : ""}`}
              >
                Border
              </Button>
              <Button
                variant={"outline"}
                onClick={() => { setActiveColorMode("fill") }}
                className={`h-6 text-xs ${activeColorMode === 'fill' ? "dark:bg-accent bg-accent" : ""}`}
              >
                Fill
              </Button>
            </div>

            {/* Preset Grid */}
            <div className="grid grid-cols-6 gap-2">
              {/* 5. TRANSPARENT OPTION (Essential for Fill) */}
              <button
                onClick={() => handleColorChange('transparent')}
                className={`w-6 h-6 rounded-full border flex items-center justify-center bg-white ${activeColorValue === 'transparent' ? "ring-2 ring-offset-1 ring-blue-500 border-blue-500" : "border-gray-200"}`}
                title="Transparent"
              >
                {/* Red diagonal line to indicate 'no color' */}
                <div className="w-full h-px bg-red-400 rotate-45 scale-125" />
              </button>

              {COLORS.map((c) => {
                // Visual Swap: If it's black & dark mode, show white button
                const previewColor = getDisplayColor(c, theme);

                return (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)} // Save the REAL color (#000000)
                    // Use the PREVIEW color for the background (#ffffff)
                    style={{ backgroundColor: previewColor }}
                    className={`w-6 h-6 rounded-full border border-black/5 ${activeColorValue === c ? "scale-110 ring-blue-500/50 ring-2 ring-offset-1" : ""
                      }`}
                    title={c}
                  />
                );
              })}
            </div>

            <div className="flex justify-between items-center gap-2 mt-1 mr-2">
              <p className="text-xs text-muted-foreground">Hex</p>
              <Input
                className="h-7 font-mono uppercase text-xs"
                // 6. Bind Input to current mode's value
                value={activeColorValue === 'transparent' ? '' : activeColorValue}
                onChange={(e) => handleColorChange(e.target.value)}
                maxLength={7}
                placeholder={activeColorMode === 'fill' ? "None" : "#000000"}
              />
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

