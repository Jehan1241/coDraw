// src/utils/freehand.ts
import { getStroke } from "perfect-freehand";

// 1. Helper to convert [x1, y1, x2, y2] -> [[x1, y1], [x2, y2]]
export function toPairs(array: number[]) {
    const result = [];
    for (let i = 0; i < array.length - 1; i += 2) {
        result.push([array[i], array[i + 1]]);
    }
    return result;
}

// 2. Helper to turn the stroke points into an SVG path string
export function getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return "";

    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
}

// 3. Main function to get options based on stroke width
export function getFreehandPath(points: number[], width: number) {
    const pairs = toPairs(points);

    const stroke = getStroke(pairs, {
        size: width * 1.5, // Make it slightly thicker to match visual weight of normal lines
        thinning: 0.5,     // How much it thins based on speed (0 to 1)
        smoothing: 0.5,    // Smoothes out jagged corners
        streamline: 0.5,   // Catch-up effect
        simulatePressure: true,
    });

    return getSvgPathFromStroke(stroke);
}