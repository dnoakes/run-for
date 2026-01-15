
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    getGlobalCauses,
    getPledgedActivityIds,
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

    if (!session?.user || !session.accessToken) {
        redirect("/");
    }

    // 1. Fetch from Strava
    const stravaRes = await getRecentActivities(session.accessToken as string);

    // 2. Sync to DB if successful
    if (stravaRes.status === 200 && stravaRes.data.length > 0) {
        await syncActivities(stravaRes.data, session.user.id);
    }

    // 3. Fetch from DB
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
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold">Your Dashboard</h1>
                    {/* SignOut button is in the header usually, but we can keep it here or relying on the header */}
                </div>

                <UserDashboard
                    user={session.user}
                    activities={unpledged}
                    causes={causes}
                    initialRules={rules}
                    history={history}
                    summary={summary}
                    totalFetched={stravaRes.data.length}
                    fetchStatus={stravaRes.status}
                />
            </div>
        </div>
    );
}
