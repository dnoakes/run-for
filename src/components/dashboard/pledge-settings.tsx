"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { savePledgeRule } from "@/app/actions";

interface Cause {
    id: string;
    title: string;
}

interface PledgeRule {
    id: string;
    causeId: string;
    percentage: number;
    isEnabled: boolean;
}

export function PledgeSettings({
    causes,
    initialRules,
}: {
    causes: Cause[];
    initialRules: PledgeRule[];
}) {
    const [open, setOpen] = useState(false);
    const [rules, setRules] = useState<Map<string, { percentage: number; isEnabled: boolean }>>(
        new Map()
    );
    const [isSaving, setSaving] = useState(false);

    // Initialize state from props
    useEffect(() => {
        const map = new Map();
        // Default all causes to 0% disabled if no rule exists
        causes.forEach((c) => {
            map.set(c.id, { percentage: 0, isEnabled: false });
        });

        // Apply existing rules
        initialRules.forEach((r) => {
            map.set(r.causeId, { percentage: r.percentage, isEnabled: r.isEnabled });
        });
        setRules(map);
    }, [causes, initialRules]);

    const updateRule = (causeId: string, updates: Partial<{ percentage: number; isEnabled: boolean }>) => {
        setRules((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(causeId) || { percentage: 0, isEnabled: false };
            newMap.set(causeId, { ...current, ...updates });
            return newMap;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save sequentially for now (could be Promise.all)
            const promises: Promise<any>[] = [];
            rules.forEach((val, key) => {
                // Only save if it's enabled OR if it was previously enabled (to disable it)
                // Actually, simpler to just upsert all modifications or diff them.
                // For MVP, just save all user overrides.
                if (val.isEnabled || val.percentage > 0) {
                    promises.push(savePledgeRule(key, val.percentage, val.isEnabled));
                }
                // If we have an existing rule but now it's 0/disabled, we should probably save that too to persist the state.
                // So, let's just save everything that might have changed.
                // Ideally we diff, but saving all is safe.
                promises.push(savePledgeRule(key, val.percentage, val.isEnabled));
            });

            await Promise.all(promises);
            setOpen(false);
        } catch (e) {
            console.error(e);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const totalPercentage = Array.from(rules.values())
        .filter((r) => r.isEnabled)
        .reduce((acc, curr) => acc + curr.percentage, 0);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Settings className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Auto-Pledge Settings</SheetTitle>
                    <SheetDescription>
                        Automatically split your miles when new runs are synced.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-8">
                    <div className={`p-4 rounded-lg flex justify-between items-center ${totalPercentage > 100 ? 'bg-red-500/10 text-red-500' : 'bg-muted'}`}>
                        <span className="font-medium">Total Allocation</span>
                        <span className="font-bold text-lg">{totalPercentage}%</span>
                    </div>

                    {causes.map((cause) => {
                        const rule = rules.get(cause.id) || { percentage: 0, isEnabled: false };
                        return (
                            <div key={cause.id} className="space-y-4 border-b border-border/50 pb-6 last:border-0">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`switch-${cause.id}`} className="font-medium text-base">
                                        {cause.title}
                                    </Label>
                                    <Switch
                                        id={`switch-${cause.id}`}
                                        checked={rule.isEnabled}
                                        onCheckedChange={(checked) => updateRule(cause.id, { isEnabled: checked })}
                                    />
                                </div>

                                {rule.isEnabled && (
                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Allocation</span>
                                            <span>{rule.percentage}%</span>
                                        </div>
                                        <Slider
                                            value={[rule.percentage]}
                                            max={100}
                                            step={5}
                                            onValueChange={(vals) => updateRule(cause.id, { percentage: vals[0] })}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <SheetFooter>
                    <Button onClick={handleSave} disabled={isSaving || totalPercentage > 100} className="w-full">
                        {isSaving ? "Saving..." : <><Save size={16} className="mr-2" /> Save Changes</>}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
