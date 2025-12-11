import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "./ui/button";

interface TextToolbarProps {
    shape: any;
    onUpdate: (attrs: any) => void;
}

export const TextToolbar = ({ shape, onUpdate }: TextToolbarProps) => {
    const COLORS = [
        { value: "", label: "Auto" },
        { value: "#ef4444", label: "Red" },
        { value: "#3b82f6", label: "Blue" },
        { value: "#22c55e", label: "Green" },
        { value: "#eab308", label: "Yellow" },
    ];

    const toggleBold = () => onUpdate({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' });
    const toggleItalic = () => onUpdate({ fontStyle: shape.fontStyle === 'italic' ? 'normal' : 'italic' });
    const toggleUnderline = () => onUpdate({ textDecoration: shape.textDecoration === 'underline' ? 'none' : 'underline' });

    return (
        <div
            className="absolute flex items-center gap-1 p-1 bg-popover border border-border rounded-md shadow-md -top-12 left-0 z-50 text-popover-foreground"
            onMouseDown={(e) => e.preventDefault()}
            style={{ pointerEvents: 'auto' }}
        >
            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${shape.fontWeight === 'bold' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={toggleBold}
            >
                <Bold className="w-4 h-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${shape.fontStyle === 'italic' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={toggleItalic}
            >
                <Italic className="w-4 h-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${shape.textDecoration === 'underline' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={toggleUnderline}
            >
                <Underline className="w-4 h-4" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            {COLORS.map((colorItem) => {
                const isActive = colorItem.value === ""
                    ? !shape.fill || shape.fill === ""
                    : shape.fill === colorItem.value;

                return (
                    <button
                        key={colorItem.label}
                        className={`w-5 h-5 rounded-full transition-all ${isActive ? 'ring-1 scale-105 ring-offset-1 ring-ring ring-offset-background' : ''} ${colorItem.value === "" ? "bg-foreground" : ""}`}
                        style={{ backgroundColor: colorItem.value ? colorItem.value : undefined }}
                        onClick={() => onUpdate({ fill: colorItem.value })}
                        title={colorItem.label}
                    />
                );
            })}
        </div>
    );
};