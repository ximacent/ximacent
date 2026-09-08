"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, Coins } from "lucide-react";
import type { Election } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";
import { ElectionStatusBadge } from "./election-status-badge";
import { ElectionBannerFallback } from "./election-banner-fallback";
import { Skeleton } from "@/components/ui/skeleton";

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${s.toLocaleDateString("en-US", fmt)} – ${e.toLocaleDateString(
    "en-US",
    sameYear ? fmt : { ...fmt, year: "numeric" }
  )}, ${e.getFullYear()}`;
}

export function ElectionCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-4 p-6 md:p-7">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="border-t border-border/50 pt-4">
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

export function ElectionCard({ election, index = 0 }: { election: Election; index?: number }) {
  const bannerSrc = mediaUrl(election.bannerUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <Link
        href={`/elections/${election.slug}`}
        className="group focus-ring block overflow-hidden rounded-lg"
      >
        <article className="surface-card relative flex h-full flex-col justify-between overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-champagne/30 hover:shadow-elevated">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-elevated">
            {bannerSrc ? (
              <Image
                src={bannerSrc}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <ElectionBannerFallback />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
            <div className="absolute right-3 top-3">
              <ElectionStatusBadge status={election.status} />
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-between p-6 md:p-7">
            <div>
              <div className="mb-1 flex items-start justify-between gap-3">
                <h3 className="font-display text-xl text-cream transition group-hover:text-champagne-soft md:text-2xl">
                  {election.title}
                </h3>
                <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 text-stone transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-champagne" />
              </div>

              {election.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">
                  {election.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/50 pt-4 text-xs text-stone">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateRange(election.startDate, election.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                GHS {election.pricePerVote} / vote
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

/**
 * Draft elections shown as "upcoming" — intentionally NOT a Link. No navigation
 * affordance, reduced opacity, desaturated image, cursor-not-allowed — signals
 * "not open yet" rather than inviting a click that would just 404/be blocked
 * server-side anyway (getElectionDetail already excludes drafts).
 */
export function UpcomingElectionCard({
  election,
  index = 0,
}: {
  election: Election;
  index?: number;
}) {
  const bannerSrc = mediaUrl(election.bannerUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      <article
        aria-disabled="true"
        className="surface-card relative flex h-full cursor-not-allowed flex-col justify-between overflow-hidden opacity-55 grayscale"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-elevated">
          {bannerSrc ? (
            <Image
              src={bannerSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <ElectionBannerFallback />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
          <div className="absolute right-3 top-3">
            <ElectionStatusBadge status={election.status} />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col justify-between p-6 md:p-7">
          <div>
            <h3 className="font-display text-xl text-cream md:text-2xl">{election.title}</h3>
            {election.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">
                {election.description}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/50 pt-4 text-xs text-stone">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateRange(election.startDate, election.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              GHS {election.pricePerVote} / vote
            </span>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
