"use client";

import { Activity, Heart, History, ListTodo, Zap } from "lucide-react";
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
import { ShareDialog } from "./share-dialog";
import { SignOutButton } from "@/components/auth/signout-button";

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

interface ShareData {
    mode: "run" | "impact";
    userName: string;
    causeName: string;
    miles: number;
    date?: string;
    runName?: string;
}

export function UserDashboard({
    user,
    activities,
    causes,
    initialRules,
    history,
    summary: initialSummary,
    stravaConnected,
}: {
    user: any;
    activities: StravaActivity[];
    causes: Cause[];
    initialRules: any[];
    history: any[];
    summary: any[];
    stravaConnected: boolean;
}) {
    const [unpledged, setUnpledged] = useState(activities);
    const [summary, setSummary] = useState(initialSummary);
    const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null);
    const [isPledging, setPledging] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const router = useRouter();

    useEffect(() => { setUnpledged(activities); }, [activities]);
    useEffect(() => { setSummary(initialSummary); }, [initialSummary]);

    useEffect(() => {
        const runAutoPledge = async () => {
            if (activities.length > 0 && initialRules && initialRules.some((r: any) => r.isEnabled)) {
                const res = await syncAndAutoPledge(activities);
                if (res.pledged > 0) {
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
            const milesToAdd = Math.round(selectedActivity.distance * 0.000621371);
            setUnpledged((prev) => prev.filter((a) => a.id !== selectedActivity.id));
            setSummary((prev) => {
                const existingIndex = prev.findIndex((s) => s.causeId === causeId);
                if (existingIndex >= 0) {
                    const newSummary = [...prev];
                    newSummary[existingIndex] = {
                        ...newSummary[existingIndex],
                        totalMiles: newSummary[existingIndex].totalMiles + milesToAdd
                    };
                    return newSummary;
                } else {
                    const cause = causes.find(c => c.id === causeId);
                    return [...prev, { causeId, causeTitle: cause?.title || "Unknown Cause", totalMiles: milesToAdd }];
                }
            });
            setSelectedActivity(null);
            router.refresh();
        } catch (e) {
            console.error(e);
        } finally {
            setPledging(false);
        }
    };

    return (
        <div className="bg-background/80 backdrop-blur-md border border-primary/20 p-6 rounded-2xl max-w-2xl w-full shadow-2xl shadow-primary/10">
            {/* Header */}
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
                <div className="flex items-center gap-2">
                    <PledgeSettings causes={causes} initialRules={initialRules} />
                    <SignOutButton />
                </div>
            </div>

            {/* Strava connect CTA */}
            {!stravaConnected && (
                <div className="mb-6 p-4 rounded-xl border border-dashed border-orange-500/40 bg-orange-500/5 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-sm">Connect Strava to sync your runs</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Link your Strava account to automatically import activities.</p>
                    </div>
                    <a href="/api/strava/connect">
                        <Button size="sm" className="shrink-0 gap-2">
                            <Zap size={14} /> Connect Strava
                        </Button>
                    </a>
                </div>
            )}

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
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="text-primary" size={20} />
                        Unpledged Runs
                    </h4>

                    <div className="space-y-3 pr-2">
                        {unpledged.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                {stravaConnected
                                    ? <p>All caught up! Go for a run.</p>
                                    : <p>Connect Strava above to import your runs.</p>
                                }
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
                                        <p className="font-medium truncate max-w-[200px]">{activity.name}</p>
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
                                                            <Heart size={16} className="text-muted-foreground group-hover/btn:text-primary" />
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
                    <PledgeHistory
                        history={history}
                        userName={user.name || "Runner"}
                        onShare={setShareData}
                    />
                </TabsContent>
            </Tabs>

            <ShareDialog
                isOpen={!!shareData}
                onClose={() => setShareData(null)}
                data={shareData}
            />
        </div>
    );
}
