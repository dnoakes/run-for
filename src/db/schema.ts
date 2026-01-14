import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
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

export const causes = sqliteTable("causes", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .references(() => users.id, { onDelete: "cascade" }), // Nullable: If null, it's a global cause
    isGlobal: integer("is_global", { mode: "boolean" }).notNull().default(false),
    title: text("title").notNull(),
    description: text("description").notNull(),
    targetMiles: integer("target_miles").notNull(),
    currentMiles: integer("current_miles").notNull().default(0),
    imageUrl: text("image_url"),
    verificationStatus: text("verification_status", { enum: ["pending", "verified", "rejected"] }).default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
})

export const pledgeRules = sqliteTable("pledge_rules", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    causeId: text("cause_id")
        .notNull()
        .references(() => causes.id, { onDelete: "cascade" }),
    percentage: integer("percentage").notNull(), // 0-100
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
})

// Relations
export const causesRelations = relations(causes, ({ one, many }) => ({
    user: one(users, {
        fields: [causes.userId],
        references: [users.id],
    }),
    pledgeRules: many(pledgeRules),
}))

export const pledgeRulesRelations = relations(pledgeRules, ({ one }) => ({
    user: one(users, {
        fields: [pledgeRules.userId],
        references: [users.id],
    }),
    cause: one(causes, {
        fields: [pledgeRules.causeId],
        references: [causes.id],
    }),
}))

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
