"use client";

import { motion } from "framer-motion";

interface HistoryItem {
    id: string;
    milesApplied: number;
    appliedAt: Date;
    activity: {
        name: string;
        distance: number;
        startDate: Date;
    };
    cause: {
        title: string;
    };
}

export function PledgeHistory({ history }: { history: HistoryItem[] }) {
    if (!history || history.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No pledge history yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {history.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-muted/30 p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-primary/10 transition-colors"
                >
                    <div>
                        <p className="font-medium text-sm">{item.activity?.name || "Unknown Activity"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{item.activity?.startDate ? new Date(item.activity.startDate).toLocaleDateString() : ""}</span>
                            <span>•</span>
                            <span className="text-primary font-semibold">
                                {item.milesApplied} miles
                            </span>
                            <span>→</span>
                            <span>{item.cause?.title || "Unknown Cause"}</span>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {new Date(item.appliedAt).toLocaleDateString()}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
