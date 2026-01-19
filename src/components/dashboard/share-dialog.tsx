
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
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
    if (!data) return null;

    const handleShare = async () => {
        const shareData = {
            title: `My Run for ${data.causeName}`,
            text: `I just dedicated ${data.miles} miles to ${data.causeName} on RunFor!`,
            url: "https://runfor.app", // Replace with actual URL/dynamic link later
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback for desktop? Copy to clipboard maybe?
            alert("Sharing not supported on this device/browser yet. Take a screenshot!");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-transparent border-none shadow-none">
                <div className="flex flex-col gap-4">
                    {/* Card Preview */}
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
                            <Share2 size={18} />
                            Share Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
