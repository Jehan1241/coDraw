import { Button } from "./components/ui/button";

export function Topbar(){
    return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-sm z-10 flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">My Whiteboard</h1>
      <Button size="sm">Save</Button>
    </header>
  );
}