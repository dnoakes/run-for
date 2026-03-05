"use client"

import { useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { DedicationCard } from "./dedication-card";

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        mode: "run" | "impact";
        userName: string;
        causeName: string;
        miles: number;
        date?: string;
        runName?: string;
    } | null;
}

export function ShareDialog({ isOpen, onClose, data }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);

    if (!data) return null;

    const shareText = `I just dedicated ${data.miles} miles to ${data.causeName} on RunFor!`;
    const shareUrl = "https://run-for.pages.dev";

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `My Run for ${data.causeName}`,
                    text: shareText,
                    url: shareUrl,
                });
            } catch {
                // User cancelled — not an error
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // clipboard not available — silently fail
            }
        }
    };

    const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-transparent border-none shadow-none">
                <div className="flex flex-col gap-4">
                    <div className="transform scale-100 hover:scale-[1.02] transition-transform duration-300">
                        <DedicationCard
                            mode={data.mode}
                            userName={data.userName}
                            causeName={data.causeName}
                            miles={data.miles}
                            date={data.date}
                            runName={data.runName}
                        />
                    </div>

                    <div className="bg-background p-4 rounded-xl border flex flex-col gap-3">
                        <div className="text-center space-y-1">
                            <h3 className="font-bold">Share your impact!</h3>
                            <p className="text-xs text-muted-foreground">Inspire others to run for a cause.</p>
                        </div>
                        <Button onClick={handleShare} className="w-full gap-2" size="lg">
                            {copied ? (
                                <><Check size={18} /> Copied!</>
                            ) : hasNativeShare ? (
                                <><Share2 size={18} /> Share Now</>
                            ) : (
                                <><Copy size={18} /> Copy Link</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
