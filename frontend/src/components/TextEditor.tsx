import React, { useEffect, useRef, useLayoutEffect } from "react";
import { Html } from "react-konva-utils";

interface TextEditorProps {
    shape: any;
    scale: number; // Passed from CanvasArea (viewport.scale)
    onChange: (val: string) => void;
    onFinish: () => void;
}

export const TextEditor = ({ shape, scale, onChange, onFinish }: TextEditorProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 1. MANUAL STYLES (Counter-Scaling)
    // We multiply by 'scale' here because we are about to force the DOM element to Scale 1.
    const visualFontSize = (shape.fontSize || 24) * scale;
    const visualWidth = (shape.width || 200) * scale;
    const visualLineHeight = (shape.lineHeight || 1);

    const style: React.CSSProperties = {
        width: `${visualWidth}px`,
        minWidth: `${visualWidth}px`,

        fontSize: `${visualFontSize}px`,
        lineHeight: visualLineHeight,

        fontFamily: shape.fontFamily || "sans-serif",
        color: shape.fill,
        textAlign: shape.align || "left",

        background: "transparent",
        border: "none",
        outline: "none",
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre",
        padding: "0px",
        margin: "0px",
        transformOrigin: "left top"
    };

    // 2. AUTO-RESIZE HEIGHT
    useLayoutEffect(() => {
        const tx = textareaRef.current;
        if (tx) {
            tx.style.height = "0px";
            tx.style.height = `${tx.scrollHeight}px`;
        }
    }, [shape.text, visualFontSize]);

    // 3. CLICK OUTSIDE
    useEffect(() => {
        let isMounted = true;
        const handleClickOutside = (e: MouseEvent) => {
            if (!isMounted) return;
            if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
                onFinish();
            }
        };
        const timer = setTimeout(() => {
            window.addEventListener("click", handleClickOutside);
        }, 100);
        return () => {
            isMounted = false;
            clearTimeout(timer);
            window.removeEventListener("click", handleClickOutside);
        };
    }, [onFinish]);

    return (
        <Html
            groupProps={{ x: shape.x, y: shape.y, rotation: shape.rotation }}
            divProps={{ style: { opacity: 1 } }}

            // 4. THE FIX: Return an Object, not a String
            // We strip out the scale calculated by Konva and force it to 1.
            transformFunc={(attrs) => {
                return {
                    ...attrs,
                    scaleX: 1,
                    scaleY: 1,
                };
            }}
        >
            <textarea
                ref={textareaRef}
                value={shape.text}
                onChange={(e) => onChange(e.target.value)}
                style={style}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === "Escape") onFinish();
                }}
            />
        </Html>
    );
};