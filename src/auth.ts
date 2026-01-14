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
    callbacks: {
        async jwt({ token, account }) {
            // Persist the OAuth access_token and refresh_token to the token right after signin
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.expiresAt = account.expires_at
            }
            return token
        },
        async session({ session, token }) {
            // Send properties to the client, like an access_token and user id from a provider.
            // Note: In a real app we might not want to expose tokens to the client, 
            // but for this "Blocker Check" MVP we need to verify we have them.
            const newSession = {
                ...session,
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
            }
            return newSession
        },
    },
    debug: true,
})
