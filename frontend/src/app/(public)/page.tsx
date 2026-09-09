"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActiveElectionsSection } from "@/components/elections/active-elections-section";
import { UpcomingElectionsSection } from "@/components/elections/upcoming-elections-section";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    body: "Every vote is confirmed through encrypted payment before it counts.",
  },
  {
    icon: Sparkles,
    title: "Instant confirmation",
    body: "Know the moment your support lands — no waiting for mystery tallies.",
  },
  {
    icon: Trophy,
    title: "Live leaderboards",
    body: "Watch categories update as the competition unfolds in real time.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero — brand-first composition */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.14),_transparent_55%)]"
        />
        <div className="container relative flex min-h-[calc(100vh-4.5rem)] flex-col justify-center py-16 md:py-22">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="mb-4 font-display text-2xl text-champagne md:text-3xl">
              Ximacent
            </p>
            <h1 className="text-balance font-display text-display-md text-cream md:text-display-lg lg:text-display-xl">
              Vote with confidence.
              <span className="block text-champagne-soft">Celebrate the winners.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone md:text-lg">
              The premium platform for paid online voting — built for pageants,
              awards nights, and competitions that deserve a polished experience.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="#elections">
                  Browse elections
                  <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <ActiveElectionsSection />
      <UpcomingElectionsSection />

      <section id="how-it-works" className="border-t border-border/40 py-16 md:py-22">
        <div className="container">
          <h2 className="font-display text-display-sm text-cream md:text-display-md">
            How it works
          </h2>
          <p className="mt-3 max-w-xl text-stone">
            Three steps from nominee to confirmed vote — no account required.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="surface-card p-6 transition hover:border-champagne/30 hover:shadow-glow"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-champagne/10 text-champagne ring-1 ring-champagne/25">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg text-cream">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{feature.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
