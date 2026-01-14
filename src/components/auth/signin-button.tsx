"use client"
import { signIn } from "next-auth/react"
import { ArrowRight } from "lucide-react"

export function SignInButton() {
    return (
        <button
            onClick={() => signIn("strava")}
            className="group relative px-8 py-4 bg-secondary hover:bg-red-500 text-white rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,90,95,0.6)] transition-all flex items-center gap-2 mx-auto cursor-pointer"
        >
            Link Strava (Demo)
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-secondary"></span>
        </button>
    )
}
