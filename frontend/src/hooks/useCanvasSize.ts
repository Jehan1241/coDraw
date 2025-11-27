import { useState, useEffect, useRef } from 'react';

export function useCanvasSize() {
    const [stageSize, setStageSize] = useState({ width: 100, height: 100 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(() => {
            setStageSize({ width: container.offsetWidth, height: container.offsetHeight });
        });
        observer.observe(container);
        return () => observer.unobserve(container);
    }, []);

    return { stageSize, containerRef };
}