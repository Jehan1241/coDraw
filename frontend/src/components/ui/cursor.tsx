// src/components/Cursor.tsx
import { Path, Text } from 'react-konva';
import React from 'react';

interface CursorProps {
    x: number;
    y: number;
    color: string;
    name: string;
}

// This is the SVG path data for a "pointer" icon
const CURSOR_SVG_PATH =
    'M0 0L8.48528 8.48528C9.26633 9.26633 9.26633 10.5327 8.48528 11.3137V11.3137C7.70423 12.0948 6.4379 12.0948 5.65685 11.3137L0 5.65685V0Z';

export function Cursor({ x, y, color, name }: CursorProps) {
    return (
        <React.Fragment>
            {/* The pointer icon */}
            <Path
                x={x}
                y={y}
                data={CURSOR_SVG_PATH}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
            />
            {/* The name label */}
            <Text
                x={x + 12}
                y={y + 12}
                text={name}
                fill="white"
                padding={3}
                fontSize={10}
                background={color}
                cornerRadius={4}
            />
        </React.Fragment>
    );
}