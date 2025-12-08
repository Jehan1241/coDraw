import { ChevronLeft, ChevronRight } from "lucide-react";

interface FlybarProps {
    flyoutOpen: boolean;
    setFlyoutOpen: (open: boolean) => void;
    children?: React.ReactNode;
}

export function Flybar({ flyoutOpen, setFlyoutOpen, children }: FlybarProps) {
    return (
        <>
            <div
                className={`
            absolute top-0 left-full z-10 h-full bg-white border-y border-r shadow-sm rounded-r-xl flex items-start transition-all duration-300 ease-in-out pointer-events-auto 
            ${flyoutOpen ? "w-72 -translate-x-3" : "w-2 -translate-x-3"}`}
            >
                {/* Inner Content (Fades out when closed) */}
                <div className={`w-full p-2 pl-9 overflow-hidden flex flex-col gap-3 h-full justify-around transition-opacity duration-200 ${flyoutOpen ? "opacity-100 delay-100" : "opacity-0"}`}>
                    {children}
                </div>


            </div>
            {/* 3. THE HANDLE BUTTON (Sticks out to the right) */}
            <button
                onClick={() => setFlyoutOpen(!flyoutOpen)}
                className={`
                absolute -right-3 top-1/2 -translate-y-1/2 z-50
                h-6 w-6 bg-white border border-l-0 rounded-full shadow-md 
                flex items-center justify-center cursor-pointer hover:bg-gray-50
                pointer-events-auto transition-opacity duration-300
                ${flyoutOpen ? "opacity-100" : "opacity-100"} 
              `}
            >
                {flyoutOpen ? (
                    <ChevronLeft className="w-3 h-3 text-gray-400" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
            </button></>
    );
}