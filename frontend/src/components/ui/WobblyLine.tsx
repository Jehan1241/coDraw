// src/components/WobblyLine.tsx
import { Path } from "react-konva";
import { getFreehandPath } from "@/utils/freehand";
import { useMemo } from "react";

interface WobblyLineProps {
    id?: string;
    points: number[];
    color: string;
    width: number;
    [key: string]: any;
}

export function WobblyLine({ points, color, width, ...props }: WobblyLineProps) {
    const pathData = useMemo(() => {
        return getFreehandPath(points, width);
    }, [points, width]);

    return (
        <Path
            {...props}
            data={pathData}
            fill={color}

            // FIX: Enable stroke so hitStrokeWidth works, but make it invisible
            stroke="transparent"
            strokeEnabled={true}
            // The visual stroke width should be 0 so it doesn't add artifacts
            strokeWidth={0}

            lineCap="round"
            lineJoin="round"
        />
    );
}