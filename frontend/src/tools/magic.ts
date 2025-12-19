import type { ToolLogic } from "./types";
import type { SyncedShape } from "@/hooks/useWhiteboard";

// 1. Supported Shapes
type ShapeType = "circle" | "square" | "rectangle" | "oval" | "triangle";

export const MagicTool: ToolLogic = {
    onDown: (x, y, options) => ({
        type: "magic",
        points: [x, y],
        strokeColor: options.strokeColor,
        strokeWidth: options.strokeWidth,
        strokeType: options.strokeType,
        fill: options.fill
    }),

    onMove: (x, y, currentData) => ({
        ...currentData,
        points: [...currentData.points, x, y],
    }),

    onUp: (currentData, id) => {
        // 1. Analyze the shape
        const classification = classifyShape(currentData.points);

        // Fallback: Return original drawing if not recognized
        if (!classification) {
            return {
                id,
                type: "line",
                points: currentData.points,
                strokeColor: currentData.strokeColor,
                strokeWidth: currentData.strokeWidth,
                strokeType: currentData.strokeType,
                isMagic: true,
                tension: 0.5, // Freehand stays smooth
            };
        }

        const { shape, stats } = classification;
        
        console.log(
            `%c Detected: ${shape.toUpperCase()}`, 
            "color: #4ade80; font-weight: bold; font-size: 12px"
        );
        console.log("Stats:", stats);

        // 2. Calculate Geometry (Rotation & Dimensions)
        const bbox = getBoundingBox(currentData.points);
        let rotation = 0; // Radians
        let width = bbox.width;
        let height = bbox.height;
        const centerX = bbox.centerX;
        const centerY = bbox.centerY;

        const isAxisAligned = parseFloat(stats.axisScore) > 0.8;
        
        if (!isAxisAligned && shape !== "circle") {
            // Calculate angle using PCA
            rotation = getShapeRotation(currentData.points, centerX, centerY);
            
            // Un-rotate to measure true dimensions
            const unrotatedPoints = rotatePoints(
                currentData.points, 
                -rotation, 
                centerX, 
                centerY
            );
            const unrotatedBBox = getBoundingBox(unrotatedPoints);
            width = unrotatedBBox.width;
            height = unrotatedBBox.height;
        }

        // 3. Generate New Points
        let newPoints: number[] = [];

        if (shape === "rectangle" || shape === "square") {
            if (shape === "square") {
                const size = (width + height) / 2;
                width = size;
                height = size;
            }
            newPoints = generateRectPoints(width, height);
            newPoints = transformPoints(newPoints, centerX, centerY, rotation);
        } 
        else if (shape === "oval" || shape === "circle") {
            if (shape === "circle") {
                const size = (width + height) / 2;
                width = size;
                height = size;
                rotation = 0; 
            }
            newPoints = generateOvalPoints(width, height);
            newPoints = transformPoints(newPoints, centerX, centerY, rotation);
        }
        else if (shape === "triangle") {
            const vertices = getTriangleVertices(currentData.points);
            newPoints = [
                vertices[0].x, vertices[0].y,
                vertices[1].x, vertices[1].y,
                vertices[2].x, vertices[2].y,
            ];
        }

        return {
            id,
            type: "line", 
            points: newPoints,
            strokeColor: currentData.strokeColor,
            strokeWidth: currentData.strokeWidth,
            strokeType: currentData.strokeType,
            fill: currentData.fill, 
            isMagic: true,
            tension: 0, 
            closed: true, 
        } as SyncedShape;
    },
};

// =============================================================================
//  SHAPE GENERATORS
// =============================================================================

function generateRectPoints(w: number, h: number) {
    const hw = w / 2;
    const hh = h / 2;
    // Just the 4 corners. Konva will connect them with straight lines due to tension: 0
    return [
        -hw, -hh, // TL
         hw, -hh, // TR
         hw,  hh, // BR
        -hw,  hh, // BL
    ];
}

function generateOvalPoints(w: number, h: number) {
    const points = [];
    const steps = 64; // High resolution creates smoothness even with tension: 0
    const rx = w / 2;
    const ry = h / 2;
    
    for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        points.push(
            Math.cos(theta) * rx,
            Math.sin(theta) * ry
        );
    }
    return points;
}

// =============================================================================
//  GEOMETRY HELPERS
// =============================================================================

function transformPoints(points: number[], cx: number, cy: number, angle: number) {
    const res = [];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i+1];
        res.push(
            cx + (x * cos - y * sin),
            cy + (x * sin + y * cos)
        );
    }
    return res;
}

function rotatePoints(points: number[], angle: number, cx: number, cy: number) {
    const res = [];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let i = 0; i < points.length; i += 2) {
        const x = points[i] - cx;
        const y = points[i+1] - cy;
        res.push(
            cx + (x * cos - y * sin),
            cy + (x * sin + y * cos)
        );
    }
    return res;
}

function getShapeRotation(points: number[], cx: number, cy: number) {
    let covXY = 0;
    let varX = 0;
    let varY = 0;

    for (let i = 0; i < points.length; i += 2) {
        const x = points[i] - cx;
        const y = points[i+1] - cy;
        covXY += x * y;
        varX += x * x;
        varY += y * y;
    }
    return 0.5 * Math.atan2(2 * covXY, varX - varY); 
}

function getTriangleVertices(points: number[]) {
    const bbox = getBoundingBox(points);
    const cx = bbox.centerX;
    const cy = bbox.centerY;

    // 1. Tip 1
    let maxDist = -1;
    let idxA = 0;
    for (let i = 0; i < points.length; i += 2) {
        const d = Math.hypot(points[i] - cx, points[i+1] - cy);
        if (d > maxDist) { maxDist = d; idxA = i; }
    }
    const pA = { x: points[idxA], y: points[idxA+1] };

    // 2. Tip 2
    maxDist = -1;
    let idxB = 0;
    for (let i = 0; i < points.length; i += 2) {
        const d = Math.hypot(points[i] - pA.x, points[i+1] - pA.y);
        if (d > maxDist) { maxDist = d; idxB = i; }
    }
    const pB = { x: points[idxB], y: points[idxB+1] };

    // 3. Tip 3
    maxDist = -1;
    let idxC = 0;
    for (let i = 0; i < points.length; i += 2) {
        const px = points[i], py = points[i+1];
        const dist = Math.abs((pB.y - pA.y) * px - (pB.x - pA.x) * py + pB.x * pA.y - pB.y * pA.x);
        if (dist > maxDist) { maxDist = dist; idxC = i; }
    }
    const pC = { x: points[idxC], y: points[idxC+1] };

    return [pA, pB, pC];
}

// =============================================================================
//  SHAPE CLASSIFIER (Same as before)
// =============================================================================

interface ClassificationResult {
    shape: ShapeType;
    stats: {
        aspectRatio: string;
        variance: string;
        axisScore: string;
        solidity: string;
        cornerScore: string;
    };
}

export function classifyShape(points: number[]): ClassificationResult | null {
    if (points.length < 10) return null;

    const bbox = getBoundingBox(points);
    const width = bbox.width;
    const height = bbox.height;
    const diagonal = Math.hypot(width, height);

    // --- 1. CLOSURE CHECK ---
    const startX = points[0], startY = points[1];
    const endX = points[points.length - 2], endY = points[points.length - 1];
    const gap = Math.hypot(startX - endX, startY - endY);
    const isClosed = gap < diagonal * 0.3;

    if (!isClosed) return null;

    // --- 2. CALCULATE METRICS ---
    const variance = getRadiusVariance(points, bbox.centerX, bbox.centerY);
    const aspect = width / height;
    const polygonArea = getPolygonArea(points);
    const boxArea = width * height;
    const solidity = polygonArea / boxArea;
    const axisScore = getAxisAlignmentScore(points);
    const cornerScore = getCornerScore(points, bbox);

    const stats = {
        aspectRatio: aspect.toFixed(2),
        variance: variance.toFixed(2),
        axisScore: axisScore.toFixed(2),
        solidity: solidity.toFixed(2),
        cornerScore: cornerScore.toFixed(2),
    };

    // --- 3. CLASSIFICATION LOGIC ---

    // RULE 1: STRICT AXIS OVERRIDE
    if (axisScore > 0.8) {
        if (aspect > 0.8 && aspect < 1.25) return { shape: "square", stats };
        return { shape: "rectangle", stats };
    }

    // RULE 2: LOW SOLIDITY (< 0.65) -> Triangle vs Diamond
    if (solidity < 0.65) {
        if (cornerScore < 0.9) return { shape: "triangle", stats };
        if (aspect > 0.85 && aspect < 1.15) return { shape: "square", stats }; 
        return { shape: "rectangle", stats }; 
    }

    // RULE 3: HIGH SOLIDITY (>= 0.65) -> Round vs Boxy
    let isRound = false;

    if (axisScore > 0.6) isRound = false; // Boxy
    else if (axisScore < 0.35) isRound = true; // Round
    else isRound = cornerScore > 0.26; // Ambiguous -> Trust Corners

    if (isRound) {
        if (aspect > 0.8 && aspect < 1.25) return { shape: "circle", stats };
        return { shape: "oval", stats };
    } else {
        if (aspect > 0.8 && aspect < 1.25) return { shape: "square", stats };
        return { shape: "rectangle", stats };
    }
}

// =============================================================================
//  MATH HELPERS
// =============================================================================

function getCornerScore(points: number[], bbox: { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }) {
    const corners = [
        { x: bbox.minX, y: bbox.minY },
        { x: bbox.maxX, y: bbox.minY },
        { x: bbox.maxX, y: bbox.maxY },
        { x: bbox.minX, y: bbox.maxY },
    ];
    let totalDist = 0;
    for (const corner of corners) {
        let minCornerDist = Infinity;
        for (let i = 0; i < points.length; i += 2) {
            const d = Math.hypot(points[i] - corner.x, points[i+1] - corner.y);
            if (d < minCornerDist) minCornerDist = d;
        }
        totalDist += minCornerDist;
    }
    const diagonal = Math.hypot(bbox.width, bbox.height);
    return totalDist / diagonal;
}

function getAxisAlignmentScore(points: number[]) {
    let horizontalLen = 0;
    let verticalLen = 0;
    let totalLen = 0;
    for (let i = 0; i < points.length - 4; i += 2) {
        const dx = Math.abs(points[i + 2] - points[i]);
        const dy = Math.abs(points[i + 3] - points[i + 1]);
        const len = Math.hypot(dx, dy);
        if (len === 0) continue;
        if (dx > dy * 3) horizontalLen += len;
        else if (dy > dx * 3) verticalLen += len;
        totalLen += len;
    }
    if (totalLen === 0) return 0;
    return (horizontalLen + verticalLen) / totalLen;
}

function getPolygonArea(points: number[]) {
    let area = 0;
    for (let i = 0; i < points.length; i += 2) {
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[(i + 2) % points.length] || points[0];
        const y2 = points[(i + 3) % points.length] || points[1];
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area / 2);
}

function getRadiusVariance(points: number[], cx: number, cy: number) {
    const radii: number[] = [];
    let sum = 0;
    for (let i = 0; i < points.length; i += 2) {
        const r = Math.hypot(points[i] - cx, points[i + 1] - cy);
        radii.push(r);
        sum += r;
    }
    const avg = sum / radii.length;
    let vSum = 0;
    for (const r of radii) vSum += Math.pow(r - avg, 2);
    return Math.sqrt(vSum / radii.length) / avg;
}

function getBoundingBox(points: number[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }
    return {
        minX, minY, maxX, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: minX + (maxX - minX) / 2,
        centerY: minY + (maxY - minY) / 2,
    };
}