"use client";

import { motion } from "framer-motion";
import { Link2, Heart, Share2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full h-[100dvh] flex flex-col justify-center items-center px-4 text-center">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 max-w-4xl space-y-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-500">
            Make Every Mile <br className="hidden md:block" />
            <span className="text-primary">Meaningful.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Turn your Strava runs into awareness for the causes you love.
            <span className="block mt-2 font-medium text-foreground">No money, just sweat.</span>
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="pt-8"
          >
            <button className="group relative px-8 py-4 bg-secondary hover:bg-red-500 text-white rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,90,95,0.6)] transition-all flex items-center gap-2 mx-auto cursor-pointer">
              Start Running For...
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-secondary"></span>
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 animate-bounce text-muted-foreground"
        >
          <p className="text-sm uppercase tracking-widest">Scroll to explore</p>
        </motion.div>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-background/50 border border-white/5 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-colors"
              >
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.text}</p>
              </motion.div>
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
            {[
              { title: "Clean Water for All", distance: "42,039 miles", color: "from-cyan-500 to-blue-500" },
              { title: "Mental Health Awareness", distance: "15,200 miles", color: "from-purple-500 to-pink-500" },
              { title: "Save Our Forests", distance: "8,920 miles", color: "from-green-500 to-emerald-700" },
              { title: "Local Animal Shelter", distance: "3,100 miles", color: "from-orange-400 to-red-500" },
            ].map((cause, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="min-w-[300px] md:min-w-[350px] snap-start bg-muted rounded-xl overflow-hidden group cursor-pointer"
              >
                <div className={`h-40 w-full bg-gradient-to-br ${cause.color} relative p-6 flex items-end`}>
                  <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90">
                    Official NPO
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold">{cause.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-primary font-mono">{cause.distance}</span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-3/4 rounded-full" />
                    </div>
                  </div>
                  <button className="w-full py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium cursor-pointer">
                    Run for this
                  </button>
                </div>
              </motion.div>
            ))}
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
