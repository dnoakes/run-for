
import { cn } from "@/lib/utils";
import { Heart, Trophy } from "lucide-react";

interface DedicationProps {
    mode: "run" | "impact";
    userName?: string;
    causeName: string;
    miles: number;
    date?: string; // Only for 'run' mode
    runName?: string; // Only for 'run' mode
    className?: string;
}

export function DedicationCard({
    mode,
    userName,
    causeName,
    miles,
    date,
    runName,
    className
}: DedicationProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl aspect-[4/5] flex flex-col justify-between",
            "bg-gradient-to-br from-blue-600 to-purple-700",
            className
        )}>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
                    <Heart className="w-4 h-4 text-pink-300 fill-pink-300" />
                    <span>RunFor.app Dedication</span>
                </div>
                <h3 className="text-3xl font-bold leading-tight">
                    {mode === "run" ? "I ran for" : "I support"}
                </h3>
                <h2 className="text-4xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                    {causeName}
                </h2>
            </div>

            {/* Stats */}
            <div className="relative z-10 text-center py-8">
                <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                    <span className="text-6xl font-black block leading-none">{miles}</span>
                    <span className="text-sm uppercase tracking-widest font-bold opacity-80">Miles Contributed</span>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 border-t border-white/20 pt-6">
                {mode === "run" && runName && (
                    <div className="mb-2">
                        <p className="font-semibold text-lg truncate">{runName}</p>
                        <p className="text-sm opacity-70">{date ? new Date(date).toLocaleDateString() : 'Recent Run'}</p>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                            {userName ? userName.charAt(0) : "Me"}
                        </div>
                        <span className="font-medium text-sm">{userName || "A Runner"}</span>
                    </div>
                    <span className="font-mono text-xs opacity-60">runfor.app</span>
                </div>
            </div>
        </div>
    );
}
