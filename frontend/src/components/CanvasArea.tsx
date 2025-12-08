import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Transformer } from "react-konva";
import type { Tool, ToolOptions } from "@/pages/BoardPage";
import { Cursor } from "@/components/ui/cursor";
import { BoardStorage } from "../utils/boardStorage";
import { useCanvasSize } from "@/hooks/useCanvasSize";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import type { ActiveUser } from "./BoardHeader";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { useZoom } from "@/hooks/useZoom";
import { useMouseMove } from "@/hooks/useMouseMove";
import { WobblyLine } from "./ui/WobblyLine";
import { WelcomeScreen } from "./WelcomeScreen";


interface CanvasAreaProps {
  tool: Tool;
  options: ToolOptions;
  boardId: string;
  onActiveUsersChange?: (users: ActiveUser[]) => void;

}

const getDashArray = (type?: string, width?: number) => {
  const w = width || 2;
  if (type === 'dashed') return [w * 4, w * 4];
  if (type === 'dotted') return [w, w * 2];
  return undefined;
};

export function CanvasArea({ tool, boardId, onActiveUsersChange, options }: CanvasAreaProps) {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const { mouseHandlers, currentShapeData } = useMouseMove({ throttledSetAwareness, saveThumbnail, setViewport, tool, yjsShapesMap, options, setSelectedId })

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    transformerRef.current.nodes([]);

    if (selectedId) {
      const node = stageRef.current.findOne("#" + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
      }
    }

    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, syncedShapes]);



  const ERASER_SCREEN_SIZE = 15;

  const renderShape = (shape: any, extraProps: any = {}) => {
    const hitWidth = Math.max(
      shape.strokeWidth || 2,
      ERASER_SCREEN_SIZE / viewport.scale
    );

    const isSelected = selectedId === shape.id;

    const handleTransformEnd = (e: any) => {
      if (!yjsShapesMap) return;
      const node = e.target;
      yjsShapesMap.set(shape.id, {
        ...shape,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
    };

    const handleDragEnd = (e: any) => {
      if (!yjsShapesMap) return;
      yjsShapesMap.set(shape.id, {
        ...shape,
        x: e.target.x(),
        y: e.target.y(),
      });
    };

    const commonProps = {
      id: shape.id,
      points: shape.points,
      stroke: shape.strokeColor || "black",
      strokeWidth: shape.strokeWidth || 2,
      hitStrokeWidth: hitWidth,
      lineCap: "round" as const,
      lineJoin: "round" as const,
      listening: true,
      draggable: tool === 'select' && isSelected, // Only draggable if selected
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
      ...extraProps
    };

    if (shape.type === 'rect') {
      return (
        <Rect
          key={shape.id || 'temp'}
          {...commonProps}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill || "transparent"}
          stroke={shape.strokeColor || "black"}
          dash={getDashArray(shape.strokeType, shape.strokeWidth)}
          cornerRadius={shape.strokeType === 'wobbly' ? 10 : 0}
        />
      );
    }

    if (shape.strokeType === 'wobbly' && shape.points) {
      return (
        <WobblyLine
          key={shape.id || 'temp'}
          {...commonProps}
          color={shape.strokeColor || "black"}
          width={shape.strokeWidth || 2}
        />
      );
    }

    if (shape.points) {
      return (
        <Line
          key={shape.id || 'temp'} // <--- Here
          {...commonProps}
          dash={getDashArray(shape.strokeType, shape.strokeWidth)}
          tension={0.5}
        />
      );
    }
    return null
  };



  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white"
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
        draggable={tool == "pan"}
        onDragEnd={mouseHandlers.onDragEnd}
        onMouseDown={mouseHandlers.onMouseDown}
        onMouseUp={mouseHandlers.onMouseUp}
        onMouseMove={mouseHandlers.onStageMouseMove}
        onMouseLeave={mouseHandlers.onStageLeave}
      >
        <Layer>
          {/* 3. RENDER SAVED SHAPES */}
          {syncedShapes.map((shape) => {
            if (shape.type === "line" || shape.type === "rect") {
              const isDrawingTool = tool === "pencil" || tool === "rectangle";
              return renderShape(shape, {
                listening: !isDrawingTool // Disable listening if drawing to draw rect in rect
              });
            }
            return null;
          })}


          {Array.from(remoteLines.entries()).map(([clientID, shapeData]) => (
            renderShape(shapeData, {
              key: `ghost-${clientID}`,
              opacity: 0.5,
              listening: false // Click-through
            })
          ))}
          {currentShapeData && (currentShapeData.points || currentShapeData.type === 'rect') && renderShape(currentShapeData)}
          {/* RENDER CURSORS */}
          {Array.from(smoothCursors.entries()).map(([clientID, cursor]) => (
            <Cursor
              key={clientID}
              x={cursor.x}
              y={cursor.y}
              name={cursor.name}
              color={cursor.color}
            />
          ))}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Prevent shrinking below 5px
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {syncedShapes.length === 0 && !currentShapeData && <WelcomeScreen />}
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