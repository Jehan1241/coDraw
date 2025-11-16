// client/src/components/ShareModal.tsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Globe, Link as LinkIcon } from "lucide-react";

// 1. Make sure this Board type matches the one in DashboardPage
interface Board {
    id: string;
    name: string;
    is_public: boolean;
    owner_id: string | null;
}

interface ShareModalProps {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    onBoardUpdate: (updatedBoard: Board) => void;
}

const API_URL = 'http://localhost:8080/api';

export function ShareModal({ board, isOpen, onClose, onBoardUpdate }: ShareModalProps) {
    const { token } = useAuth();
    const [emailToInvite, setEmailToInvite] = useState("");
    const [isPatching, setIsPatching] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    const shareableLink = `${window.location.origin}/board/${board.id}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareableLink);
        toast.success("Copied to clipboard!");
    };

    // Handle toggling public access
    const handlePublicToggle = async (isPublic: boolean) => {
        if (!token || isPatching) return;
        setIsPatching(true);

        try {
            const res = await fetch(`${API_URL}/boards/${board.id}/share`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ is_public: isPublic }),
            });
            if (!res.ok) throw new Error("Failed to update status");

            const updatedBoard = await res.json();
            onBoardUpdate(updatedBoard); // Update the state in the dashboard
            toast.success(`Board is now ${isPublic ? 'public' : 'private'}.`);
        } catch (err) {
            toast.error("Error", { description: "Failed to update board status." });
        } finally {
            setIsPatching(false);
        }
    };

    // Handle inviting a user
    const handleInvite = async () => {
        if (!token || !emailToInvite || isInviting) return;
        setIsInviting(true);

        try {
            const res = await fetch(`${API_URL}/boards/${board.id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ email: emailToInvite }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to invite user.');

            toast.success("Success!", { description: `User ${emailToInvite} invited.` });
            setEmailToInvite(""); // Clear input
        } catch (err: any) {
            toast.error("Error", { description: err.message });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share "{board.name}"</DialogTitle>
                    <DialogDescription>
                        Manage access for your board.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Public Access Toggle */}
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <Globe className="h-6 w-6" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Share to web</p>
                            <p className="text-sm text-muted-foreground">
                                {board.is_public ? "Anyone with the link can view." : "Only invited people can access."}
                            </p>
                        </div>
                        <Switch
                            checked={board.is_public}
                            onCheckedChange={handlePublicToggle}
                            disabled={isPatching}
                        />
                    </div>

                    {/* Copy Link Button */}
                    {board.is_public && (
                        <div className="flex space-x-2">
                            <Input value={shareableLink} readOnly />
                            <Button size="icon" onClick={copyToClipboard}>
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Invite by Email */}
                    <div>
                        <Label htmlFor="email" className="mb-2 block">Invite by email</Label>
                        <div className="flex space-x-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={emailToInvite}
                                onChange={(e) => setEmailToInvite(e.target.value)}
                            />
                            <Button onClick={handleInvite} disabled={isInviting}>
                                {isInviting ? "Inviting..." : "Invite"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}