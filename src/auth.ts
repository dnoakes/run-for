import { eq } from "drizzle-orm"

import NextAuth from "next-auth"
import Strava from "next-auth/providers/strava"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, users, accounts, sessions, verificationTokens } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [
        Strava({
            clientId: process.env.STRAVA_CLIENT_ID,
            clientSecret: process.env.STRAVA_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "read,activity:read",
                    approval_prompt: "force",
                },
            },
        }),
    ],
    // Remove the unused jwt callback entirely since we are using database strategy
    callbacks: {
        async session({ session, user }) {
            // Fetch the account to get the access_token
            // In a production app, verify if you should expose this.
            // For this app, we need it for the frontend/server-component API calls.

            // We need to query the accounts table. 
            // Since we are inside the auth config, we can use the 'db' instance.
            const account = await db.query.accounts.findFirst({
                where: eq(accounts.userId, user.id)
            })

            return {
                ...session,
                accessToken: account?.access_token,
                refreshToken: account?.refresh_token,
            }
        },
    },
    debug: true,
})
