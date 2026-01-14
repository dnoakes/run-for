"use client"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground hover:bg-white/10"
            title="Sign Out"
        >
            <LogOut size={20} />
        </Button>
    )
}
