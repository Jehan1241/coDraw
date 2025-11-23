import { useState, useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Tool } from "@/pages/BoardPage";
import { Cursor } from "@/components/ui/cursor";
import { BoardStorage } from "../../utils/boardStorage";
import { useCanvasSize } from "@/hooks/useCanvasSize";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import type { ActiveUser } from "./BoardHeader";
import type { SyncedShape } from "@/hooks/useWhiteboard";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { useZoom } from "@/hooks/useZoom";

type LineData = number[];

interface CanvasAreaProps {
  tool: Tool;
  boardId: string;
  onActiveUsersChange?: (users: ActiveUser[]) => void;
}

export function CanvasArea({ tool, boardId, onActiveUsersChange }: CanvasAreaProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<any>(null);
  const [currentLine, setCurrentLine] = useState<LineData>([]);


  const saveThumbnail = () => {
    if (!stageRef.current) return;
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 0.2,
      mimeType: "image/png",
    });

    BoardStorage.update(boardId, { thumbnail: dataURL });
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool !== "pencil" || e.target !== e.target.getStage() || !yjsShapesMap) {
      return;
    }
    setIsDrawing(true);
    const pos = e.target.getStage().getRelativePointerPosition();
    if (!pos) return
    setCurrentLine([pos.x, pos.y]);
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== "pencil" || !yjsShapesMap || e.target !== e.target.getStage()) {
      return;
    }
    const pos = e.target.getStage().getRelativePointerPosition();
    if (!pos) return;
    setCurrentLine((prevLine) => prevLine.concat([pos.x, pos.y]));
  }

  const handleMouseUp = () => {
    if (!isDrawing || tool !== "pencil" || !yjsShapesMap) {
      return;
    }
    setIsDrawing(false);
    const uniqueId = crypto.randomUUID();
    const newLine: SyncedShape = {
      id: uniqueId,
      type: "line",
      points: currentLine,
    };
    yjsShapesMap.set(uniqueId, newLine);
    setCurrentLine([]);
    throttledSetAwareness(null, null, null);
    saveThumbnail();
  };

  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      if (e.target !== e.target.getStage()) return;
      const pos = e.target.getStage().getRelativePointerPosition();
      if (pos) {
        throttledSetAwareness(
          pos.x,
          pos.y,
          isDrawing ? currentLine.concat([pos.x, pos.y]) : null
        );
      }
    }
    handleMouseMove(e);
  };

  const handleStageMouseLeave = (_: KonvaEventObject<MouseEvent>) => {
    throttledSetAwareness(null, null, null);
  };

  const cursorStyle = tool === "pencil" ? "crosshair" : "default";

  const { stageSize, containerRef } = useCanvasSize();
  const { yjsShapesMap, remoteLines, smoothCursors, syncedShapes, throttledSetAwareness } = useWhiteboard({ boardId, onActiveUsersChange });
  const { zoomToCenter, stagePos, stageScale, handleWheel } = useZoom({ stageRef, stageSize })


  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-200"
      style={{ cursor: cursorStyle }}
    >

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={tool == "select"}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
      >
        <Layer>
          {syncedShapes.map((shape) => {
            if (shape.type === "line") {
              return (
                <Line
                  key={shape.id}
                  points={shape.points}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }
            return null;
          })}
          {Array.from(remoteLines.entries()).map(([clientID, points]) => (
            <Line
              key={`ghost-${clientID}`}
              points={points}
              stroke="#888"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={0.5}
            />
          ))}
          <Line
            points={currentLine}
            stroke="black"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
          {Array.from(smoothCursors.entries()).map(([clientID, cursor]) => (
            <Cursor
              key={clientID}
              x={cursor.x}
              y={cursor.y}
              name={cursor.name}
              color={cursor.color}
            />
          ))}
        </Layer>
      </Stage>
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white p-2 rounded-lg shadow-md border z-50">
        <button
          onClick={() => zoomToCenter(-1)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Zoom Out (Ctrl+Wheel Down)"
        >
          <Minus className="w-4 h-4 text-gray-600" />
        </button>

        <span className="text-xs font-mono w-12 text-center">
          {Math.round(stageScale * 100)}%
        </span>

        <button
          onClick={() => zoomToCenter(1)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Zoom In (Ctrl+Wheel Up)"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <button
          onClick={() => zoomToCenter(0)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Reset Zoom"
        >
          <RefreshCcw className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
}