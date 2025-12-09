import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Transformer } from "react-konva";
import type { Tool, ToolOptions } from "@/pages/BoardPage";
import { Cursor } from "@/components/ui/cursor";
import { BoardStorage } from "../utils/boardStorage";
import { useCanvasSize } from "@/hooks/useCanvasSize";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { useZoom } from "@/hooks/useZoom";
import { useMouseMove } from "@/hooks/useMouseMove";
import { WobblyLine } from "./ui/WobblyLine";
import { WelcomeScreen } from "./WelcomeScreen";
import { Button } from "./ui/button";
import { useTheme } from "./ui/theme-provider";
import { getCursorStyle, getResizeCursor, getRotateCursor } from "@/utils/cursorStyle";


interface CanvasAreaProps {
  tool: Tool;
  options: ToolOptions;
  boardId: string;
  whiteboard: ReturnType<typeof useWhiteboard>;
}

export const getDisplayColor = (color: string | undefined, theme: string | undefined) => {
  if (!color) return "black";
  const isDark = theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (!isDark) return color;
  const c = color.toLowerCase();
  if (c === "black" || c === "#000000") return "#ffffff";
  if (c === "white" || c === "#ffffff") return "#000000";
  return color;
};

const getDashArray = (type?: string, width?: number) => {
  const w = width || 2;
  if (type === 'dashed') return [w * 4, w * 4];
  if (type === 'dotted') return [w, w * 2];
  return undefined;
};

export function CanvasArea({ tool, boardId, whiteboard, options }: CanvasAreaProps) {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const { theme } = useTheme();

  const saveThumbnail = () => {
    if (!stageRef.current) return;
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 0.2,
      mimeType: "image/png",
    });
    BoardStorage.update(boardId, { thumbnail: dataURL });
  };

  const cursorStyle = getCursorStyle(theme, tool);
  const rotateCursor = getRotateCursor(theme);
  const resizeCursor = getResizeCursor(theme);
  const [forceResizeCursor, setForceResizeCursor] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const { stageSize, containerRef } = useCanvasSize();
  const { yjsShapesMap, remoteLines, smoothCursors, syncedShapes, throttledSetAwareness } = whiteboard;
  const { zoomToCenter, viewport, setViewport, handleWheel } = useZoom({ stageRef, stageSize, boardId })
  const { mouseHandlers, currentShapeData } = useMouseMove({ throttledSetAwareness, saveThumbnail, setViewport, tool, yjsShapesMap, options, setSelectedIds, setSelectionBox, selectedIds });

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    transformerRef.current.nodes([]);
    if (selectedIds.size > 0) {
      const nodes = Array.from(selectedIds)
        .map((id) => stageRef.current.findOne("#" + id))
        .filter((node) => node !== undefined);
      transformerRef.current.nodes(nodes);
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, syncedShapes]);

  const ERASER_SCREEN_SIZE = 30;

  const renderShape = (shape: any, extraProps: any = {}) => {
    const hitWidth = Math.max(
      shape.strokeWidth || 2,
      ERASER_SCREEN_SIZE / viewport.scale
    );

    const finalStroke = getDisplayColor(shape.strokeColor || "black", theme);
    const finalFill = shape.fill === "transparent"
      ? "transparent"
      : getDisplayColor(shape.fill, theme);

    const isSelected = selectedIds.has(shape.id);

    const handleTransformEnd = (e: any) => {
      if (!yjsShapesMap) return;
      const node = e.target;

      const baseAttrs = {
        ...shape,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (shape.type === 'line' || shape.points) {
        yjsShapesMap.set(shape.id, {
          ...baseAttrs,
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        });
      }
      else {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        yjsShapesMap.set(shape.id, {
          ...baseAttrs,
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          scaleX: 1,
          scaleY: 1,
        });
      }
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
      x: shape.x || 0,
      y: shape.y || 0,
      name: "whiteboard-object",
      rotation: shape.rotation || 0,
      scaleX: shape.scaleX || 1,
      scaleY: shape.scaleY || 1,
      stroke: finalStroke || "black",
      strokeWidth: shape.strokeWidth || 2,
      hitStrokeWidth: hitWidth,
      lineCap: "round" as const,
      lineJoin: "round" as const,
      listening: true,
      draggable: tool === 'select' && isSelected,
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
      ...extraProps
    };

    if (shape.type === 'rect') {
      return (
        <Rect
          key={shape.id || 'temp'}
          {...commonProps}
          width={shape.width}
          height={shape.height}
          fill={finalFill || "transparent"}
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
          points={shape.points || []}
          color={finalStroke || "black"}
          width={shape.strokeWidth || 2}
        />
      );
    }

    if (shape.points) {
      return (
        <Line
          key={shape.id || 'temp'}
          {...commonProps}
          points={shape.points || []}
          dash={getDashArray(shape.strokeType, shape.strokeWidth)}
          tension={0.5}
        />
      );
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background"
      style={{ cursor: cursorStyle }}
    >
      {forceResizeCursor && (
        <style>
          {`
            .konvajs-content {
              cursor: ${resizeCursor} !important;
            }
          `}
        </style>
      )}

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
          {selectionBox && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(0, 161, 255, 0.3)"
              stroke="#00a1ff"
              strokeWidth={1}
              listening={false}
            />
          )}
          <Transformer
            ref={transformerRef}
            rotateAnchorCursor={rotateCursor}
            anchorStyleFunc={(anchor: any) => {
              if (anchor.hasName('rotater')) return;
              anchor.on('mouseenter', () => {
                setForceResizeCursor(true);
              });
              anchor.on('mouseleave', () => {
                setForceResizeCursor(false);
              });
            }}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {syncedShapes.length === 0 && !currentShapeData && <WelcomeScreen />}
      <div className="fixed bottom-4 right-4 flex items-center gap-1 bg-background p-2 rounded-lg shadow-md border z-50 select-none">
        <Button
          variant={"ghost"}
          className="h-8 w-8"
          onClick={() => zoomToCenter(-1)}
        >
          <Minus className="w-4 h-4 text-foreground " />
        </Button>

        <span className="text-xs font-mono w-12 text-center">
          {Math.round(viewport.scale * 100)}%
        </span>

        <Button
          variant={"ghost"}
          onClick={() => zoomToCenter(1)}
          className="h-8 w-8"

        >
          <Plus className="w-4 h-4 text-foreground  " />
        </Button>

        <div className="w-px h-4 mx-1" />

        <Button
          variant={"ghost"}
          onClick={() => zoomToCenter(0)}
          className="h-8 w-8"
        >
          <RefreshCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}