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
            try {
                const account = await db.query.accounts.findFirst({
                    where: eq(accounts.userId, user.id)
                })

                if (!account) return session

                // Check if token is expired (or expires in < 5 mins)
                // account.expires_at is typically seconds. Date.now() is ms.
                const nowSeconds = Math.floor(Date.now() / 1000)
                const isExpired = account.expires_at ? account.expires_at < (nowSeconds + 300) : false

                if (isExpired && account.refresh_token) {
                    console.log("Token expired, refreshing...")
                    try {
                        const response = await fetch("https://www.strava.com/oauth/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                client_id: process.env.STRAVA_CLIENT_ID,
                                client_secret: process.env.STRAVA_CLIENT_SECRET,
                                grant_type: "refresh_token",
                                refresh_token: account.refresh_token,
                            }),
                        })

                        const tokens = await response.json()

                        if (response.ok && tokens.access_token) {
                            // Update DB
                            await db.update(accounts)
                                .set({
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token,
                                    expires_at: tokens.expires_at,
                                })
                                .where(
                                    eq(accounts.userId, user.id)
                                )

                            console.log("Token refreshed successfully")
                            return {
                                ...session,
                                accessToken: tokens.access_token,
                            }
                        } else {
                            console.error("Failed to refresh token", tokens)
                        }
                    } catch (error) {
                        console.error("Error refreshing token:", error)
                    }
                }

                return {
                    ...session,
                    accessToken: account.access_token,
                }
            } catch (error) {
                console.error("Session callback error:", error)
                return session
            }
        },
    },
    debug: true,
})
