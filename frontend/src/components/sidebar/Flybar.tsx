import { ChevronLeft, ChevronRight } from "lucide-react";

interface FlybarProps {
    flyoutOpen: boolean;
    setFlyoutOpen: (open: boolean) => void;
    children?: React.ReactNode;
}

export function Flybar({ flyoutOpen, setFlyoutOpen, children }: FlybarProps) {
    return (
        <><div
            className={`
            absolute top-0 left-full z-10 h-full bg-white border-y border-r shadow-sm rounded-r-xl flex items-center transition-all duration-300 ease-in-out pointer-events-auto 
            ${flyoutOpen ? "w-48 -translate-x-3" : "w-2 -translate-x-3"}`}
        >
            {/* Inner Content (Fades out when closed) */}
            <div className={`w-full pl-4 overflow-hidden transition-opacity duration-200 ${flyoutOpen ? "opacity-100 delay-100" : "opacity-0"}`}>
                <div className="p-4 pl-6 whitespace-nowrap">
                    {children}
                </div>
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