import React from "react";
import { Path, Text } from "react-konva";
import { useTheme } from "./theme-provider";

interface CursorProps {
    x: number;
    y: number;
    color: string;
    name: string;
    tool?: string;
    zoom: number;
}


const TOOL_CONFIG: Record<string, { path: string; scale: number; offsetX: number; offsetY: number }> = {
    eraser: {
        path: "M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z",
        scale: 2,
        offsetX: 16,
        offsetY: 16
    },
    pencil: {
        path: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z M15 5 l4 4",
        scale: 1.333,
        offsetX: 0,
        offsetY: 32
    },
    magic: {
        path: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z M15 5 l4 4",
        scale: 1.333,
        offsetX: 0,
        offsetY: 32
    },
    select: {
        path: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
        scale: 1,
        offsetX: 3,
        offsetY: 3
    },
    pan: {
        path: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2 M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2 M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
        scale: 1,
        offsetX: 12,
        offsetY: 12
    },
    rectangle: {
        path: "M6 4 L6 12 M6 4 L20 4 M20 4 L20 18 M13 18 L20 18 M3 18 L9 18 M6 15 L6 21",
        scale: 1.875,
        offsetX: 10,
        offsetY: 33
    },
    text: {
        path: "M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1 M7 22h1a4 4 0 0 0 4-4v-1 M7 2h1a4 4 0 0 1 4 4v1",
        scale: 1,
        offsetX: 12,
        offsetY: 12
    }
};

export function Cursor({ x, y, color, name, tool, zoom }: CursorProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const textColor = isDark ? "#ffffff" : "#000000";

    const config = TOOL_CONFIG[tool || 'select'] || TOOL_CONFIG['select'];

    const strokeWidth = tool === 'eraser' ? 0.5 : 1.5;

    const safeZoom = zoom || 1;
    const inverseZoom = 1 / safeZoom;

    return (
        <React.Fragment>
            <Path
                x={x - (config.offsetX * inverseZoom)}
                y={y - (config.offsetY * inverseZoom)}
                data={config.path}
                stroke={color}
                strokeWidth={strokeWidth}
                scaleX={config.scale * inverseZoom}
                scaleY={config.scale * inverseZoom}
                lineCap="round"
                lineJoin="round"
                listening={false}
            />
            <Text
                x={x + (16 * inverseZoom)}
                y={y + (16 * inverseZoom)}
                scaleX={inverseZoom}
                scaleY={inverseZoom}
                text={name}
                fill={textColor}
                fontSize={12}
                fontFamily="sans-serif"
                padding={4}
                background={color}
                cornerRadius={4}
                opacity={0.9}
                listening={false}
            />
        </React.Fragment>
    );
}