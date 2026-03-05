
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import {
    getGlobalCauses,
    getPledgeRules,
    getPledgeHistory,
    getUserImpactSummary,
    syncActivities,
    getUnpledgedActivities
} from "@/app/actions";
import { UserDashboard } from "@/components/dashboard/user-dashboard";

export const runtime = "edge";

async function getRecentActivities(accessToken: string) {
    try {
        const res = await fetch(
            "https://www.strava.com/api/v3/athlete/activities?per_page=30",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: "no-store",
            }
        );
        if (!res.ok) {
            return { data: [], status: res.status };
        }
        const data = await res.json();
        return { data, status: res.status };
    } catch (e) {
        console.error("Failed to fetch Strava activities:", e);
        return { data: [], status: 500 };
    }
}

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    // Check if Strava is connected for this user
    const stravaAccount = await db.query.accounts.findFirst({
        where: and(eq(accounts.userId, session.user.id), eq(accounts.provider, "strava"))
    });
    const stravaConnected = !!stravaAccount;

    // Sync Strava activities if connected
    if (stravaConnected && session.accessToken) {
        const stravaRes = await getRecentActivities(session.accessToken as string);
        if (stravaRes.status === 200 && stravaRes.data.length > 0) {
            await syncActivities(stravaRes.data, session.user.id);
        }
    }

    const [unpledged, causes, rules, history, summary] = await Promise.all([
        getUnpledgedActivities(),
        getGlobalCauses(),
        getPledgeRules(),
        getPledgeHistory(),
        getUserImpactSummary(),
    ]);

    return (
        <div className="min-h-screen bg-background pt-24 px-4 pb-12 flex flex-col items-center">
            <div className="w-full max-w-5xl space-y-8">
                <UserDashboard
                    user={session.user}
                    activities={unpledged}
                    causes={causes}
                    initialRules={rules}
                    history={history}
                    summary={summary}
                    stravaConnected={stravaConnected}
                />
            </div>
        </div>
    );
}
