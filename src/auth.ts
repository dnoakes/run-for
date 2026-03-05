import { and, eq } from "drizzle-orm"

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
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
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.AUTH_EMAIL_FROM ?? "RunFor <noreply@run-for.pages.dev>",
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            try {
                // Only look for the Strava account — other providers don't have activity tokens
                const stravaAccount = await db.query.accounts.findFirst({
                    where: and(eq(accounts.userId, user.id), eq(accounts.provider, "strava"))
                })

                if (!stravaAccount) return session

                // Check if token is expired (or expires in < 5 mins)
                const nowSeconds = Math.floor(Date.now() / 1000)
                const isExpired = stravaAccount.expires_at ? stravaAccount.expires_at < (nowSeconds + 300) : false

                if (isExpired && stravaAccount.refresh_token) {
                    console.log("Strava token expired, refreshing...")
                    try {
                        const response = await fetch("https://www.strava.com/oauth/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                client_id: process.env.AUTH_STRAVA_ID,
                                client_secret: process.env.AUTH_STRAVA_SECRET,
                                grant_type: "refresh_token",
                                refresh_token: stravaAccount.refresh_token,
                            }),
                        })

                        const tokens = await response.json()

                        if (response.ok && tokens.access_token) {
                            await db.update(accounts)
                                .set({
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token,
                                    expires_at: tokens.expires_at,
                                })
                                .where(
                                    and(eq(accounts.userId, user.id), eq(accounts.provider, "strava"))
                                )

                            console.log("Strava token refreshed successfully")
                            return { ...session, accessToken: tokens.access_token }
                        } else {
                            console.error("Failed to refresh Strava token", tokens)
                        }
                    } catch (error) {
                        console.error("Error refreshing Strava token:", error)
                    }
                }

                return { ...session, accessToken: stravaAccount.access_token }
            } catch (error) {
                console.error("Session callback error:", error)
                return session
            }
        },
    },
    debug: process.env.NODE_ENV === "development",
})
