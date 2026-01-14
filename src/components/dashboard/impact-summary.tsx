import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Trophy, Heart } from "lucide-react";

interface ImpactItem {
    causeId: string;
    causeTitle: string;
    totalMiles: number;
}

export function ImpactSummary({ summary }: { summary: ImpactItem[] }) {
    if (!summary || summary.length === 0) return null;

    const totalMiles = summary.reduce((acc, item) => acc + item.totalMiles, 0);
    const topCause = summary.reduce((prev, current) =>
        (prev.totalMiles > current.totalMiles) ? prev : current
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalMiles.toFixed(1)} miles</div>
                    <p className="text-xs text-muted-foreground">
                        Donated across {summary.length} causes
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Cause</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate">{topCause.causeTitle}</div>
                    <p className="text-xs text-muted-foreground">
                        {topCause.totalMiles.toFixed(1)} miles contributed
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
