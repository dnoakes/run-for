import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core"
import type { AdapterAccountType } from "next-auth/adapters"

// --- Auth Tables (NextAuth Standard) ---

export const users = sqliteTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    // Gamification Fields
    totalMiles: integer("total_miles").default(0),
    currentStreak: integer("current_streak").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
})

export const accounts = sqliteTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
)

export const sessions = sqliteTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
)

// --- RunFor App Tables ---

export const causes = sqliteTable("cause", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    targetMiles: integer("target_miles").notNull(),
    currentMiles: integer("current_miles").default(0),
    imageUrl: text("image_url"),
    active: integer("active", { mode: "boolean" }).default(true),
})

export const activities = sqliteTable("activity", {
    id: text("id").primaryKey(), // Strava Activity ID
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name"),
    distance: integer("distance").notNull(), // stored in meters? Strava uses meters. Drizzle integer usually okay.
    movingTime: integer("moving_time"), // seconds
    startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
    summaryPolyline: text("summary_polyline"),
})

export const ledger = sqliteTable("ledger", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    activityId: text("activity_id")
        .notNull()
        .references(() => activities.id),
    causeId: text("cause_id")
        .notNull()
        .references(() => causes.id),
    userId: text("userId")
        .notNull()
        .references(() => users.id),
    milesApplied: integer("miles_applied").notNull(),
    appliedAt: integer("applied_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
})
