import { useEffect, useRef, useState, useMemo } from "react";
import {
    Stage,
    Layer,
    Line,
    Rect,
    Transformer,
    Text as KonvaText,
} from "react-konva";
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
import {
    getCursorStyle,
    getResizeCursor,
    getRotateCursor,
} from "@/utils/cursorStyle";
import { useSelectionShortcuts } from "@/hooks/useSelectionShortcuts";
import { TextEditor } from "./TextEditor";
import React from "react";
import { useTextTool } from "@/hooks/useTextTool";

interface CanvasAreaProps {
    tool: Tool;
    setTool: (tool: Tool) => void;
    options: ToolOptions;
    boardId: string;
    whiteboard: ReturnType<typeof useWhiteboard>;
}

export const getDisplayColor = (
    color: string | undefined,
    theme: string | undefined,
) => {
    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (!color || color === "") {
        return isDark ? "#ffffff" : "#000000";
    }
    const c = color.toLowerCase();
    if (isDark) {
        if (c === "#000000" || c === "black") return "#ffffff";
    } else {
        if (c === "#ffffff" || c === "white") return "#000000";
    }
    return color;
};

const getDashArray = (type?: string, width?: number) => {
    const w = width || 2;
    if (type === "dashed") return [w * 4, w * 4];
    if (type === "dotted") return [w, w * 2];
    return undefined;
};

export function CanvasArea({
    tool,
    setTool,
    boardId,
    whiteboard,
    options,
}: CanvasAreaProps) {
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
    const [editingId, setEditingId] = useState<string | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionBox, setSelectionBox] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    const { stageSize, containerRef } = useCanvasSize();
    const {
        yjsShapesMap,
        remoteLines,
        smoothCursors,
        syncedShapes,
        throttledSetAwareness,
    } = whiteboard;
    const { zoomToCenter, viewport, setViewport, handleWheel } = useZoom({
        stageRef,
        stageSize,
        boardId,
    });
    const { mouseHandlers, currentShapeData } = useMouseMove({
        throttledSetAwareness,
        saveThumbnail,
        setViewport,
        tool,
        yjsShapesMap,
        options,
        setSelectedIds,
        setSelectionBox,
        selectedIds,
    });
    const {
        handleTextTransform,
        handleTextChange,
        handleFinish,
        handleTextTransformEnd,
        handleAttributeChange,
    } = useTextTool({
        transformerRef,
        viewport,
        editingId,
        yjsShapesMap,
        setTool,
        tool,
        setEditingId,
        selectedIds,
    });
    useSelectionShortcuts({
        selectedIds,
        setSelectedIds,
        yjsShapesMap: whiteboard.yjsShapesMap,
    });

    const visibleShapes = useMemo(() => {
        const BUFFER = 1000;

        // Calculate Viewport Box once per frame
        const visibleLeft = -viewport.x / viewport.scale - BUFFER;
        const visibleTop = -viewport.y / viewport.scale - BUFFER;
        const visibleRight = (stageSize.width - viewport.x) / viewport.scale + BUFFER;
        const visibleBottom = (stageSize.height - viewport.y) / viewport.scale + BUFFER;

        return syncedShapes.filter((shape) => {
            if (selectedIds.has(shape.id)) return true;

            //used cached bound if there
            if (shape.bounds) {
                return (
                    shape.bounds.maxX >= visibleLeft &&
                    shape.bounds.minX <= visibleRight &&
                    shape.bounds.maxY >= visibleTop &&
                    shape.bounds.minY <= visibleBottom
                );
            }

            //fallback
            const x = shape.x || 0;
            const y = shape.y || 0;
            const w = shape.width || 0;
            const h = shape.height || 0;

            return (
                x + w >= visibleLeft &&
                x <= visibleRight &&
                y + h >= visibleTop &&
                y <= visibleBottom
            );
        });
    }, [syncedShapes, viewport, stageSize, selectedIds]);


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
    }, [selectedIds, syncedShapes, editingId]);


    //window.multiplyShapes() to stress test
    useEffect(() => {
        // @ts-ignore
        window.multiplyShapes = () => {
            const map = whiteboard.yjsShapesMap;
            if (!map) return
            const doc = map.doc;
            const currentShapes = Array.from(map.values());

            if (!doc || currentShapes.length === 0) {
                console.warn("Draw something first");
                return;
            }
            console.log(`Multiplying ${currentShapes.length} shapes by 1000...`);
            doc.transact(() => {
                for (let i = 0; i < 1000; i++) {
                    currentShapes.forEach((shape: any) => {
                        const newId = crypto.randomUUID();
                        // Spread shapes WIDELY so culling can actually work
                        const offsetX = (Math.random() - 0.5) * 5000;
                        const offsetY = (Math.random() - 0.5) * 5000;
                        const newShape = {
                            ...shape,
                            id: newId,
                            x: (shape.x || 0) + offsetX,
                            y: (shape.y || 0) + offsetY,
                        };
                        map.set(newId, newShape);
                    });
                }
            });
            console.log("Done.");
        };
    }, [whiteboard.yjsShapesMap]);

    const ERASER_SCREEN_SIZE = 30;

    const renderShape = (shape: any, extraProps: any = {}) => {
        const hitWidth = Math.max(
            shape.strokeWidth || 2,
            ERASER_SCREEN_SIZE / viewport.scale,
        );

        const finalStroke = getDisplayColor(
            shape.strokeColor || "black",
            theme,
        );
        const finalFill =
            shape.fill === "transparent"
                ? "transparent"
                : getDisplayColor(shape.fill, theme);

        const isSelected = selectedIds.has(shape.id);

        const handleTransformEnd = (e: any) => {
            if (!yjsShapesMap) return;
            const node = e.target;

            const box = node.getClientRect({ relativeTo: node.getParent() });

            const newBounds = {
                minX: box.x,
                maxX: box.x + box.width,
                minY: box.y,
                maxY: box.y + box.height,
            };

            const baseAttrs = {
                ...shape,
                x: node.x(),
                y: node.y(),
                rotation: node.rotation(),
                bounds: newBounds
            };

            if (shape.type === "line" || shape.points) {
                yjsShapesMap.set(shape.id, {
                    ...baseAttrs,
                    scaleX: node.scaleX(),
                    scaleY: node.scaleY(),
                });
            } else if (shape.type === "text") {
                handleTextTransformEnd(node, shape);
            } else {
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

            const newX = e.target.x();
            const newY = e.target.y();

            const dx = newX - (shape.x || 0);
            const dy = newY - (shape.y || 0);

            let newBounds = shape.bounds;

            if (newBounds) {
                newBounds = {
                    minX: newBounds.minX + dx,
                    maxX: newBounds.maxX + dx,
                    minY: newBounds.minY + dy,
                    maxY: newBounds.maxY + dy,
                };
            }

            yjsShapesMap.set(shape.id, {
                ...shape,
                x: newX,
                y: newY,
                bounds: newBounds,
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
            draggable: tool === "select" && isSelected,
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
            ...extraProps,
        };

        if (shape.type === "text") {
            const isEditing = editingId === shape.id;
            const currentZoom = viewport.scale;
            const konvaFontStyle = `${shape.fontWeight || "normal"} ${shape.fontStyle || "normal"}`;

            return (
                <React.Fragment key={shape.id}>
                    <KonvaText
                        {...commonProps}
                        strokeEnabled={false}
                        text={shape.text || "\u200b"}
                        fill={finalFill}
                        fontStyle={konvaFontStyle}
                        textDecoration={shape.textDecoration}
                        fontSize={(shape.fontSize || 24) * currentZoom}
                        width={shape.width * currentZoom}
                        scaleX={1 / currentZoom}
                        scaleY={1 / currentZoom}
                        onTransform={handleTextTransform}
                        fontFamily={shape.fontFamily || "sans-serif"}
                        opacity={isEditing ? 0 : 1}
                        onDblClick={() => setEditingId(shape.id)}
                    />

                    {isEditing && (
                        <TextEditor
                            shape={{ ...shape, fill: finalFill }}
                            scale={currentZoom}
                            onAttributesChange={handleAttributeChange}
                            onChange={handleTextChange}
                            onFinish={handleFinish}
                        />
                    )}
                </React.Fragment>
            );
        }

        if (shape.type === "rect") {
            return (
                <Rect
                    key={shape.id || "temp"}
                    {...commonProps}
                    width={shape.width}
                    height={shape.height}
                    fill={finalFill || "transparent"}
                    dash={getDashArray(shape.strokeType, shape.strokeWidth)}
                    cornerRadius={shape.strokeType === "wobbly" ? 10 : 0}
                />
            );
        }
        if (shape.strokeType === "wobbly" && shape.points && tool !== "magic") {
            return (
                <WobblyLine
                    key={shape.id || "temp"}
                    {...commonProps}
                    points={shape.points || []}
                    color={finalStroke || "black"}
                    width={shape.strokeWidth || 2}
                    fill={finalFill}
                    closed={shape.closed}
                />
            );
        }

        if (shape.points) {
            return (
                <Line
                    key={shape.id || "temp"}
                    {...commonProps}
                    points={shape.points || []}
                    dash={getDashArray(shape.strokeType, shape.strokeWidth)}
                    tension={shape.tension !== undefined ? shape.tension : 0.5}
                    closed={shape.closed}
                    fill={finalFill}
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
                    {/* Only map over visible shapes for better perf */}
                    {visibleShapes.map((shape) => {
                        if (
                            shape.type === "line" ||
                            shape.type === "rect" ||
                            shape.type === "text"
                        ) {
                            const isDrawingTool =
                                tool === "pencil" || tool === "rectangle";
                            return renderShape(shape, {
                                listening: !isDrawingTool,
                            });
                        }
                        return null;
                    })}

                    {Array.from(remoteLines.entries()).map(
                        ([clientID, shapeData]) =>
                            renderShape(shapeData, {
                                key: `ghost-${clientID}`,
                                opacity: 0.5,
                                listening: false,
                            }),
                    )}
                    {currentShapeData &&
                        (currentShapeData.points ||
                            currentShapeData.type === "rect") &&
                        renderShape(currentShapeData)}

                    {Array.from(smoothCursors.entries()).map(
                        ([clientID, cursor]) => (
                            <Cursor
                                key={clientID}
                                x={cursor.x}
                                y={cursor.y}
                                name={cursor.name}
                                color={cursor.color}
                                tool={cursor.tool}
                                zoom={viewport.scale}
                            />
                        ),
                    )}
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
                    {!editingId && (
                        <Transformer
                            enabledAnchors={
                                editingId
                                    ? []
                                    : selectedIds.size === 1 &&
                                        syncedShapes.find(
                                            (s) =>
                                                s.id ===
                                                Array.from(selectedIds)[0],
                                        )?.type === "text"
                                        ? [
                                            "top-left",
                                            "top-right",
                                            "bottom-left",
                                            "bottom-right",
                                            "middle-left",
                                            "middle-right",
                                        ]
                                        : undefined
                            }
                            ref={transformerRef}
                            rotateAnchorCursor={rotateCursor}
                            anchorStyleFunc={(anchor: any) => {
                                if (anchor.hasName("rotater")) return;
                                anchor.on("mouseenter", () => {
                                    setForceResizeCursor(true);
                                });
                                anchor.on("mouseleave", () => {
                                    setForceResizeCursor(false);
                                });
                            }}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5)
                                    return oldBox;
                                return newBox;
                            }}
                        />
                    )}
                </Layer>
            </Stage>

            {syncedShapes.length === 0 && !currentShapeData && (
                <WelcomeScreen />
            )}
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
                    <Plus className="w-4 h-4 text-foreground  " />
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