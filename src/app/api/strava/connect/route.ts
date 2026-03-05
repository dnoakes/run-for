import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL ?? "https://run-for.pages.dev"))
    }

    const clientId = process.env.AUTH_STRAVA_ID
    if (!clientId) {
        return new NextResponse("Strava not configured", { status: 500 })
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL ?? "https://run-for.pages.dev"}/api/strava/callback`

    // Encode the user ID in state so we can link the account in the callback
    const state = btoa(session.user.id)

    const stravaAuthUrl = new URL("https://www.strava.com/oauth/authorize")
    stravaAuthUrl.searchParams.set("client_id", clientId)
    stravaAuthUrl.searchParams.set("redirect_uri", callbackUrl)
    stravaAuthUrl.searchParams.set("response_type", "code")
    stravaAuthUrl.searchParams.set("approval_prompt", "auto")
    stravaAuthUrl.searchParams.set("scope", "read,activity:read")
    stravaAuthUrl.searchParams.set("state", state)

    return NextResponse.redirect(stravaAuthUrl)
}
