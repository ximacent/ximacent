"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Coins, Frown, Search, Trophy, X } from "lucide-react";
import { getPublicElection } from "@/lib/api/elections";
import { ElectionStatusBadge } from "@/components/elections/election-status-badge";
import { CategoryCard } from "@/components/categories/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaUrl } from "@/lib/utils";
import { ElectionBannerFallback } from "@/components/elections/election-banner-fallback";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${s.toLocaleDateString("en-US", fmt)} – ${e.toLocaleDateString("en-US", fmt)}`;
}

export function ElectionDetailClient({ slug }: { slug: string }) {
  const { data: election, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-election", slug],
    queryFn: () => getPublicElection(slug),
  });

  const [categorySearch, setCategorySearch] = useState("");

  // Client-side filter — categories are already fully loaded with the
  // election, so a debounce/network round-trip would only add latency for
  // no benefit on what's typically a small list.
  const filteredCategories = useMemo(() => {
    if (!election) return [];
    const term = categorySearch.trim().toLowerCase();
    if (!term) return election.categories;
    return election.categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [election, categorySearch]);

  if (isLoading) {
    return (
      <div className="container py-16">
        <Skeleton className="mb-6 h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-4 w-1/2" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !election) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <Frown className="h-10 w-10 text-stone" />
        <h1 className="font-display text-display-sm text-cream">Election not found</h1>
        <p className="max-w-sm text-stone">
          This election doesn&apos;t exist, hasn&apos;t launched yet, or the link may be
          incorrect.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
          <Button asChild>
            <Link href="/">Back to elections</Link>
          </Button>
        </div>
      </div>
    );
  }

  const bannerSrc = mediaUrl(election.bannerUrl);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/40">
        {bannerSrc ? (
          <>
            <Image
              src={bannerSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
          </>
        ) : (
          <>
            <ElectionBannerFallback />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
          </>
        )}
        <div className="container relative py-14 md:py-20">
          <Link
            href="/"
            className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-stone transition hover:text-champagne"
          >
            <ArrowLeft className="h-4 w-4" />
            All elections
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-4">
              <ElectionStatusBadge status={election.status} />
            </div>
            <h1 className="text-balance font-display text-display-md text-cream md:text-display-lg">
              {election.title}
            </h1>
            {election.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone md:text-lg">
                {election.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateRange(election.startDate, election.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Coins className="h-4 w-4" />
                GHS {election.pricePerVote} per vote
              </span>
              <Link
                href={`/elections/${election.slug}/results`}
                className="focus-ring inline-flex items-center gap-1.5 rounded text-champagne hover:text-champagne-soft"
              >
                <Trophy className="h-4 w-4" />
                View live results
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-14 md:py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-display-sm text-cream">Categories</h2>
            <p className="mt-1.5 text-stone">
              Choose a category to see its nominees and cast your vote.
            </p>
          </div>

          {election.categories.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories…"
                aria-label="Search categories"
                className="pl-9 pr-9"
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch("")}
                  aria-label="Clear search"
                  className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone hover:text-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {election.categories.length === 0 ? (
          <p className="text-stone">
            Categories for this election haven&apos;t been added yet.
          </p>
        ) : filteredCategories.length === 0 ? (
          <p className="text-stone">No categories match &quot;{categorySearch}&quot;.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                electionSlug={election.slug}
                bannerUrl={election.bannerUrl}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
