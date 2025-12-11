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
            points={points}
            data={pathData}
            fill={color}
            stroke="transparent"
            strokeEnabled={true}
            strokeWidth={0}
            lineCap="round"
            lineJoin="round"
        />
    );
}