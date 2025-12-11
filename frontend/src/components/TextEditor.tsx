import React, { useEffect, useRef, useLayoutEffect } from "react";
import { Html } from "react-konva-utils";
import { TextToolbar } from "./TextToolbar";

interface TextEditorProps {
    shape: any;
    scale: number;
    onChange: (val: string) => void;
    onAttributesChange: (attrs: any) => void;
    onFinish: () => void;
}

export const TextEditor = ({ shape, scale, onChange, onAttributesChange, onFinish }: TextEditorProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // <--- 1. NEW REF FOR CONTAINER

    // ... (Styles and Auto-Resize useLayoutEffect remain the same) ...
    // Calculate visualWidth, visualFontSize, style object...
    const visualFontSize = (shape.fontSize || 24) * scale;
    const visualWidth = (shape.width || 200) * scale;
    const visualLineHeight = (shape.lineHeight || 1);

    const style: React.CSSProperties = {
        width: `${visualWidth}px`,
        minWidth: `${visualWidth}px`,
        fontSize: `${visualFontSize}px`,
        lineHeight: visualLineHeight,
        fontFamily: shape.fontFamily || "sans-serif",
        textAlign: shape.align || "left",
        color: shape.fill,

        // Dynamic Styles
        fontWeight: shape.fontWeight || 'normal',
        fontStyle: shape.fontStyle || 'normal',
        textDecoration: shape.textDecoration || 'none',

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

    useLayoutEffect(() => {
        const tx = textareaRef.current;
        if (tx) {
            tx.style.height = "0px";
            tx.style.height = `${tx.scrollHeight}px`;
        }
    }, [shape.text, visualFontSize, shape.fontWeight, shape.width]);

    // 3. UPDATED CLICK OUTSIDE LOGIC
    useEffect(() => {
        let isMounted = true;
        const handleClickOutside = (e: MouseEvent) => {
            if (!isMounted) return;

            // FIX: Check if click is inside the CONTAINER (Toolbar + Textarea)
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
            transformFunc={(attrs) => ({ ...attrs, scaleX: 1, scaleY: 1 })}
        >
            {/* 4. WRAP EVERYTHING IN A DIV WITH REF */}
            <div ref={containerRef}>
                <TextToolbar shape={shape} onUpdate={onAttributesChange} />

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
            </div>
        </Html>
    );
};