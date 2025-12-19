import { Github, } from "lucide-react";
import { Button } from "./ui/button";

export function WelcomeScreen() {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden select-none text-muted-foreground">

            <div className="relative pointer-events-none group bg-none">
                <div className="flex flex-col items-center gap-8 p-12 md:p-16 min-w-[320px] md:min-w-[500px]">

                    <div className="space-y-4 text-center flex flex-col items-center">
                        <div className="space-y-1">
                            <p className="text-xl font-medium tracking-widest">
                                Start Drawing
                            </p>
                            <p className="text-xs">
                                Collaborative Sketching • Local-First • No Sign-up
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center w-full text-muted-foreground pointer-events-auto">
                        <Button variant={"outline"} className="gap-2">
                            <Github className="w-4 h-4" /> Github
                        </Button>
                    </div>

                    <div className="text-sm opacity-50">
                        Your data lives in your browser, never saved to a server.
                    </div>
                </div>
            </div>
        </div>
    );
}