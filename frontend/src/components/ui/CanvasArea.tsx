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
    const pos = e.target.getStage()!.getPointerPosition();
    if (!pos) return
    setCurrentLine([pos.x, pos.y]);
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || tool !== "pencil" || !yjsShapesMap) {
      return;
    }
    const stage = e.target.getStage();
    const pos = stage!.getPointerPosition();
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


  // --- COMBINED STAGE HANDLERS ---
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
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

          {/* Remote Ghost Lines */}
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

          {/* Local Line */}
          <Line
            points={currentLine}
            stroke="black"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />

          {/* Smooth Cursors */}
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
    </div>
  );
}