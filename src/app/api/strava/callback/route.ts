import { db } from "@/db"
import { accounts } from "@/db/schema"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const DASHBOARD_URL = `${process.env.NEXTAUTH_URL ?? "https://run-for.pages.dev"}/dashboard`

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error || !code || !state) {
        return NextResponse.redirect(`${DASHBOARD_URL}?strava_error=access_denied`)
    }

    // Decode userId from state
    let userId: string
    try {
        userId = atob(state)
    } catch {
        return NextResponse.redirect(`${DASHBOARD_URL}?strava_error=invalid_state`)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.AUTH_STRAVA_ID,
            client_secret: process.env.AUTH_STRAVA_SECRET,
            code,
            grant_type: "authorization_code",
        }),
    })

    if (!tokenResponse.ok) {
        console.error("Strava token exchange failed", await tokenResponse.text())
        return NextResponse.redirect(`${DASHBOARD_URL}?strava_error=token_exchange`)
    }

    const tokens = await tokenResponse.json()
    const stravaAthleteId = String(tokens.athlete?.id)

    if (!stravaAthleteId) {
        return NextResponse.redirect(`${DASHBOARD_URL}?strava_error=no_athlete`)
    }

    // Upsert the Strava account record linked to this user
    await db
        .insert(accounts)
        .values({
            userId,
            type: "oauth",
            provider: "strava",
            providerAccountId: stravaAthleteId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at,
            scope: tokens.scope ?? "read,activity:read",
            token_type: "Bearer",
        })
        .onConflictDoUpdate({
            target: [accounts.provider, accounts.providerAccountId],
            set: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: tokens.expires_at,
                userId,
            },
        })

    return NextResponse.redirect(`${DASHBOARD_URL}?strava_connected=1`)
}
