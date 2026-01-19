
import { Trophy, Users, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress"; // We might need to ensure this generic UI exists or use HTML progress

interface Cause {
    id: string;
    title: string;
    targetMiles: number;
    currentMiles: number;
}

export function CauseList({ causes, onPledgeClick }: { causes: Cause[], onPledgeClick: () => void }) {
    // Sort by most miles for now
    const sortedCauses = [...causes].sort((a, b) => b.currentMiles - a.currentMiles);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedCauses.map((cause) => (
                <div key={cause.id} className="bg-muted/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all group">
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Trophy size={20} />
                            </div>
                            {/* Future: Join button or 'Pledge Badge' if user has supported it */}
                        </div>

                        <div>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{cause.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Global Cause</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Progress</span>
                            <span className="text-foreground">{cause.currentMiles.toLocaleString()} miles</span>
                        </div>
                        {/* Simple Progress Bar */}
                        <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min((cause.currentMiles / cause.targetMiles) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            ))}

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 border-dashed">
                <div className="p-3 bg-primary/20 rounded-full text-primary">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Suggest a Cause</h3>
                    <p className="text-sm text-muted-foreground">Don't see what you run for?</p>
                </div>
                <button className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
                    Coming Soon
                </button>
            </div>
        </div>
    );
}
