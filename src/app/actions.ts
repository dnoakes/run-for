"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { activities, causes, ledger, users, pledgeRules } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getGlobalCauses() {
    return await db.query.causes.findMany({
        where: eq(causes.isGlobal, true),
    });
}

export async function getPledgedActivityIds(userId: string) {
    const pledges = await db.query.ledger.findMany({
        where: eq(ledger.userId, userId),
        columns: { activityId: true },
    });
    return new Set(pledges.map((p: { activityId: string }) => p.activityId));
}

export async function pledgeActivity(
    activity: {
        id: string;
        name: string;
        distance: number; // meters
        moving_time: number;
        start_date: string;
        map?: { summary_polyline?: string };
    },
    causeId: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const miles = activity.distance * 0.000621371; // Convert meters to miles

    // 1. Ensure Activity Exists
    await db
        .insert(activities)
        .values({
            id: activity.id.toString(), // Strava IDs are numbers, we store as text to be safe/consistent
            userId: userId,
            name: activity.name,
            distance: activity.distance,
            movingTime: activity.moving_time,
            startDate: new Date(activity.start_date),
            summaryPolyline: activity.map?.summary_polyline,
        })
        .onConflictDoNothing();

    // 2. Create Ledger Entry
    await db.insert(ledger).values({
        activityId: activity.id.toString(),
        causeId: causeId,
        userId: userId,
        milesApplied: Math.round(miles), // Storing integer miles? Schema says integer. might want float later but schema says integer.
    });

    // 3. Update Cause Totals (Atomic increment)
    await db
        .update(causes)
        .set({
            currentMiles: sql`${causes.currentMiles} + ${Math.round(miles)}`,
        })
        .where(eq(causes.id, causeId));

    // 4. Update User Totals
    await db
        .update(users)
        .set({
            totalMiles: sql`${users.totalMiles} + ${Math.round(miles)}`,
        })
        .where(eq(users.id, userId));

    revalidatePath("/");
    return { success: true };
}
// ... (existing code)

export async function getPledgeRules() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await db.query.pledgeRules.findMany({
        where: eq(pledgeRules.userId, session.user.id),
        with: {
            cause: true
        }
    });
}

export async function savePledgeRule(causeId: string, percentage: number, isEnabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;

    // Simple validation: Ensure total percentage across all enabled rules doesn't exceed 100?
    // For MVP, we'll trust the UI or just allow it and cap it later during processing.
    // Actually, let's just doing upsert based on (userId, causeId).
    // But Drizzle SQLite support for composite PK upsert might be tricky if not defined well.
    // We defined Keys but `pledgeRules` has its own `id`.
    // Let's find existing first.

    const existing = await db.query.pledgeRules.findFirst({
        where: (rules: any, { and, eq }: any) => and(eq(rules.userId, userId), eq(rules.causeId, causeId)),
    });

    if (existing) {
        await db
            .update(pledgeRules)
            .set({
                percentage,
                isEnabled,
                updatedAt: new Date(),
            })
            .where(eq(pledgeRules.id, existing.id));
    } else {
        await db.insert(pledgeRules).values({
            userId,
            causeId,
            percentage,
            isEnabled,
        });
    }

    revalidatePath("/");
    return { success: true };
}
// ... (existing code)

export async function syncAndAutoPledge(activitiesList: any[]) {
    const session = await auth();
    if (!session?.user?.id) return { pledged: 0 };
    const userId = session.user.id;

    // 1. Get enabled rules
    const rules = await db.query.pledgeRules.findMany({
        where: (r: any, { and, eq }: any) => and(eq(r.userId, userId), eq(r.isEnabled, true)),
    });

    if (rules.length === 0) return { pledged: 0 };

    // 2. Identify unpledged activities from the input list
    // We trust the input list is "recent activities from Strava"
    // We check DB to see if they exist in ledger
    const pledgedIds = await getPledgedActivityIds(userId);

    const candidates = activitiesList.filter(a => !pledgedIds.has(a.id.toString()));

    if (candidates.length === 0) return { pledged: 0 };

    let pledgedCount = 0;

    for (const activity of candidates) {
        const miles = activity.distance * 0.000621371;
        const stravaId = activity.id.toString();

        // Ensure activity exists
        await db.insert(activities).values({
            id: stravaId,
            userId: userId,
            name: activity.name,
            distance: activity.distance,
            movingTime: activity.moving_time,
            startDate: new Date(activity.start_date),
            summaryPolyline: activity.map?.summary_polyline,
        }).onConflictDoNothing();

        // Apply rules
        // For simple MVP: specific rule wins? or split? 
        // Logic: Apply ALL enabled rules.
        // e.g. 50% to Cause A, 50% to Cause B.
        // But wait, `milesApplied` in ledger is "miles".
        // If I have 10 miles.
        // Rule A: 50%. Rule B: 50%.
        // Ledger: Activity 1 -> Cause A (5 miles).
        // Ledger: Activity 1 -> Cause B (5 miles).

        for (const rule of rules) {
            const milesToPledge = Math.round(miles * (rule.percentage / 100));
            if (milesToPledge > 0) {
                await db.insert(ledger).values({
                    activityId: stravaId,
                    causeId: rule.causeId,
                    userId: userId,
                    milesApplied: milesToPledge,
                });

                await db.update(causes).set({
                    currentMiles: sql`${causes.currentMiles} + ${milesToPledge}`,
                }).where(eq(causes.id, rule.causeId));

                await db.update(users).set({
                    totalMiles: sql`${users.totalMiles} + ${milesToPledge}`,
                }).where(eq(users.id, userId));
            }
        }
        pledgedCount++;
    }

    if (pledgedCount > 0) {
        revalidatePath("/");
    }

    return { pledged: pledgedCount };
}

export async function getPledgeHistory() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const history = await db.query.ledger.findMany({
            where: eq(ledger.userId, session.user.id),
            with: {
                activity: true,
                cause: true,
            },
            orderBy: (ledger: any, { desc }: any) => [desc(ledger.appliedAt)],
        });

        return history;
    } catch (e) {
        console.error("Failed to fetch pledge history:", e);
        return [];
    }
}

export async function getUserImpactSummary() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Aggregation in Drizzle D1 can be tricky with `db.query`.
        // We'll use raw SQL or query builder for aggregation.
        // Let's use the query builder with `groupBy`.

        const summary = await db
            .select({
                causeId: ledger.causeId,
                causeTitle: causes.title,
                totalMiles: sql<number>`sum(${ledger.milesApplied})`,
            })
            .from(ledger)
            .leftJoin(causes, eq(ledger.causeId, causes.id))
            .where(eq(ledger.userId, session.user.id))
            .groupBy(ledger.causeId, causes.title);

        return summary;
    } catch (e) {
        console.error("Failed to fetch impact summary:", e);
        return [];
    }
}

export async function syncActivities(activitiesList: any[], userId: string) {
    // 1. Upsert all fetched activities to DB
    for (const activity of activitiesList) {
        await db.insert(activities).values({
            id: activity.id.toString(),
            userId: userId,
            name: activity.name,
            distance: activity.distance,
            movingTime: activity.moving_time,
            startDate: new Date(activity.start_date),
            summaryPolyline: activity.map?.summary_polyline,
        }).onConflictDoNothing();
    }
}

export async function getUnpledgedActivities() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const pledgedIdsSet = await getPledgedActivityIds(session.user.id);
        const pledgedIds = Array.from(pledgedIdsSet);

        // Fetch activities from DB
        const dbActivities = await db.query.activities.findMany({
            where: (t, { and, notInArray, eq }) => {
                if (pledgedIds.length > 0) {
                    return and(eq(t.userId, session.user.id), notInArray(t.id, pledgedIds));
                }
                return eq(t.userId, session.user.id);
            },
            orderBy: (t, { desc }) => [desc(t.startDate)],
        });

        return dbActivities.map((a: any) => ({
            id: a.id,
            name: a.name,
            distance: a.distance,
            moving_time: a.movingTime,
            start_date: a.startDate.toISOString(),
            map: { summary_polyline: a.summaryPolyline }
        }));

    } catch (e) {
        console.error("Failed to fetch unpledged activities:", e);
        return [];
    }
}
