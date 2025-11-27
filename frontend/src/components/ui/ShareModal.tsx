// src/components/ShareModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { user, updateName } = useUser();
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);

  // Sync local input with global user state when modal opens
  useEffect(() => {
    setNameInput(user.name);
  }, [user.name, isOpen]);

  const url = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNameInput(newName);
    // Live update the context (which updates Hocuspocus instantly)
    if (newName.trim().length > 0) {
      updateName(newName);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this board</DialogTitle>
          <DialogDescription>
            Anyone with the link can view and edit this board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. COPY LINK SECTION */}
          <div className="space-y-2">
            <Label>Board Link</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={url}
                readOnly
                className="font-mono text-xs bg-gray-50"
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* 2. IDENTITY SECTION */}
          <div className="space-y-2">
            <Label>Your Display Name</Label>
            <div className="flex items-center space-x-2">
              {/* Color indicator */}
              <div
                className="w-8 h-8 rounded-full border flex-shrink-0"
                style={{ backgroundColor: user.color }}
              />
              <Input
                value={nameInput}
                onChange={handleNameChange}
                placeholder="Enter your name"
              />
            </div>
            <p className="text-xs text-gray-400">
              This name will be shown next to your cursor.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
