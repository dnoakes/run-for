"use client";

import { Activity, Heart, History, ListTodo } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { pledgeActivity, syncAndAutoPledge } from "@/app/actions";
import { motion } from "framer-motion";
import { PledgeSettings } from "./pledge-settings";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImpactSummary } from "./impact-summary";
import { PledgeHistory } from "./pledge-history";

interface Cause {
    id: string;
    title: string;
    targetMiles: number;
    currentMiles: number;
}

interface StravaActivity {
    id: string;
    name: string;
    distance: number; // meters
    moving_time: number;
    start_date: string;
    map?: { summary_polyline?: string };
}

export function UserDashboard({
    user,
    activities,
    causes,
    initialRules,
    history,
    summary,
}: {
    user: any;
    activities: StravaActivity[];
    causes: Cause[];
    initialRules: any[];
    history: any[];
    summary: any[];
}) {
    const [unpledged, setUnpledged] = useState(activities);
    const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(
        null
    );
    const [isPledging, setPledging] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const runAutoPledge = async () => {
            if (activities.length > 0 && initialRules && initialRules.some((r: any) => r.isEnabled)) {
                const res = await syncAndAutoPledge(activities);
                if (res.pledged > 0) {
                    console.log("Auto-pledged activities:", res.pledged);
                    router.refresh();
                }
            }
        };
        runAutoPledge();
    }, [activities, initialRules, router]);

    const handlePledge = async (causeId: string) => {
        if (!selectedActivity) return;
        setPledging(true);
        try {
            await pledgeActivity(selectedActivity, causeId);
            // Remove from list locally for instant feedback
            setUnpledged((prev) => prev.filter((a) => a.id !== selectedActivity.id));
            setSelectedActivity(null);
            router.refresh(); // Refresh to update history/summary
        } catch (e) {
            console.error(e);
            alert("Failed to pledge. Try again.");
        } finally {
            setPledging(false);
        }
    };

    return (
        <div className="bg-background/80 backdrop-blur-md border border-primary/20 p-6 rounded-2xl max-w-2xl w-full shadow-2xl shadow-primary/10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {user.image && (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="w-16 h-16 rounded-full border-2 border-primary"
                        />
                    )}
                    <div className="text-left">
                        <p className="text-sm text-muted-foreground">Welcome back,</p>
                        <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                    </div>
                </div>
                <PledgeSettings causes={causes} initialRules={initialRules} />
            </div>

            <ImpactSummary summary={summary} />

            <Tabs defaultValue="runs" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="runs" className="flex items-center gap-2">
                        <ListTodo size={16} /> Needed Action
                        {unpledged.length > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                {unpledged.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <History size={16} /> History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="runs" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="text-primary" size={20} />
                            Unpledged Runs
                        </h4>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                        {unpledged.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                <p>All caught up! Go for a run. 🏃‍♂️</p>
                            </div>
                        ) : (
                            unpledged.map((activity) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-muted/30 p-4 rounded-xl flex items-center justify-between group hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium truncate max-w-[200px]">
                                            {activity.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(activity.start_date).toLocaleDateString()} •{" "}
                                            {(activity.distance * 0.000621371).toFixed(2)} mi
                                        </p>
                                    </div>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedActivity(activity)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Pledge
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Pledge this run</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Select a cause to dedicate your{" "}
                                                    <span className="font-bold text-foreground">
                                                        {(activity.distance * 0.000621371).toFixed(2)} miles
                                                    </span>{" "}
                                                    to.
                                                </p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {causes.map((cause) => (
                                                        <button
                                                            key={cause.id}
                                                            onClick={() => handlePledge(cause.id)}
                                                            disabled={isPledging}
                                                            className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group/btn"
                                                        >
                                                            <span className="font-medium">{cause.title}</span>
                                                            <Heart
                                                                size={16}
                                                                className="text-muted-foreground group-hover/btn:text-primary"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </motion.div>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in-50 slide-in-from-bottom-2">
                    <PledgeHistory history={history} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
