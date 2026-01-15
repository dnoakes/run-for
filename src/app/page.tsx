import { Link2, Heart, Share2, ArrowRight } from "lucide-react";
import { SignInButton } from "@/components/auth/signin-button";
import { auth } from "@/auth";
import Link from "next/link";
import { db } from "@/db";
import { causes, ledger } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";

export const runtime = "edge";

async function getFeaturedCauses() {
  // Determine top causes by total miles applied in ledger
  // This is an aggregation query
  try {
    const topCauses = await db
      .select({
        id: causes.id,
        title: causes.title,
        targetMiles: causes.targetMiles,
        currentMiles: causes.currentMiles,
        // We can just rely on currentMiles stored in the cause table which we keep updated!
      })
      .from(causes)
      .where(eq(causes.isGlobal, true))
      .orderBy(desc(causes.currentMiles))
      .limit(4);

    return topCauses;
  } catch (e) {
    console.error("Failed to fetch featured causes", e);
    return [];
  }
}

export default async function Home() {
  const session = await auth();
  const featuredCauses = await getFeaturedCauses();

  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-[100dvh] flex flex-col justify-center items-center px-4 text-center">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />

        <div className="z-10 max-w-4xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-500 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Make Every Mile <br className="hidden md:block" />
            <span className="text-primary">Meaningful.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
            Turn your Strava runs into awareness for the causes you love.
            <span className="block mt-2 font-medium text-foreground">No money, just sweat.</span>
          </p>

          <div className="pt-8 flex justify-center animate-in fade-in zoom-in duration-500 delay-500">
            {!session ? (
              <SignInButton />
            ) : (
              <Link href="/dashboard" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium text-lg transition-colors flex items-center gap-2">
                Go to Dashboard <ArrowRight size={20} />
              </Link>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce text-muted-foreground">
          <p className="text-sm uppercase tracking-widest">Scroll to explore</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">How it Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to impact.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Link2, title: "Link Strava", text: "Connect your account securely. We import your runs automatically." },
              { icon: Heart, title: "Choose a Cause", text: "Select a personal or public cause to dedicate your miles to." },
              { icon: Share2, title: "Share Impact", text: "Get a custom 'Dedication Card' to share and spread awareness." },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-background/50 border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-colors"
              >
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Causes Section */}
      <section className="w-full py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Causes</h2>
              <p className="text-muted-foreground">Join thousands of runners supporting these goals.</p>
            </div>
            <button className="text-primary font-medium hover:underline flex items-center gap-2 cursor-pointer">
              View all causes <ArrowRight size={16} />
            </button>
          </div>

          {/* Horizontal Scroll Container */}
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {featuredCauses.length > 0 ? featuredCauses.map((cause, i) => (
              <div
                key={cause.id}
                className="min-w-[300px] md:min-w-[350px] snap-start bg-muted rounded-xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`h-40 w-full bg-gradient-to-br from-blue-900 to-slate-900 relative p-6 flex items-end`}>
                  <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90">
                    Global Cause
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold">{cause.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-primary font-mono">{cause.currentMiles.toLocaleString()} / {cause.targetMiles.toLocaleString()} mi</span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((cause.currentMiles / cause.targetMiles) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-full py-2 text-center text-sm font-medium text-primary">
                    View Impact
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center text-muted-foreground">
                <p>No featured causes found. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/5 text-center text-muted-foreground text-sm">
        <p>&copy; 2026 RunFor. Built for impact.</p>
      </footer>
    </main>
  );
}
