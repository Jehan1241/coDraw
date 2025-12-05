import { useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { Tool } from "@/pages/BoardPage";
import { Cursor } from "@/components/ui/cursor";
import { BoardStorage } from "../../utils/boardStorage";
import { useCanvasSize } from "@/hooks/useCanvasSize";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import type { ActiveUser } from "./BoardHeader";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { useZoom } from "@/hooks/useZoom";
import { useMouseMove } from "@/hooks/useMouseMove";


interface CanvasAreaProps {
  tool: Tool;
  boardId: string;
  onActiveUsersChange?: (users: ActiveUser[]) => void;
}

export function CanvasArea({ tool, boardId, onActiveUsersChange }: CanvasAreaProps) {
  const stageRef = useRef<any>(null);


  const saveThumbnail = () => {
    if (!stageRef.current) return;
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 0.2,
      mimeType: "image/png",
    });
    BoardStorage.update(boardId, { thumbnail: dataURL });
  };



  const cursorStyle = tool === "pencil" ? "crosshair" : "default";

  const { stageSize, containerRef } = useCanvasSize();
  const { yjsShapesMap, remoteLines, smoothCursors, syncedShapes, throttledSetAwareness } = useWhiteboard({ boardId, onActiveUsersChange });
  const { zoomToCenter, viewport, setViewport, handleWheel } = useZoom({ stageRef, stageSize, boardId })
  const { mouseHandlers, currentShapeData } = useMouseMove({ throttledSetAwareness, saveThumbnail, setViewport, tool, yjsShapesMap })


  const ERASER_SCREEN_SIZE = 15;



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
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.x}
        y={viewport.y}
        draggable={tool == "select"}
        onDragEnd={mouseHandlers.onDragEnd}
        onMouseDown={mouseHandlers.onMouseDown}
        onMouseUp={mouseHandlers.onMouseUp}
        onMouseMove={mouseHandlers.onStageMouseMove}
        onMouseLeave={mouseHandlers.onStageLeave}
      >
        <Layer>
          {syncedShapes.map((shape) => {
            if (shape.type === "line") {

              const hitWidth = Math.max(
                shape.points ? 5 : 0,
                ERASER_SCREEN_SIZE / viewport.scale
              );

              return (
                <Line
                  key={shape.id}
                  id={shape.id}
                  points={shape.points}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  hitStrokeWidth={hitWidth}
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
            points={currentShapeData}
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
          {Math.round(viewport.scale * 100)}%
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