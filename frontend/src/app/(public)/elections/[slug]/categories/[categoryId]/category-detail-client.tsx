"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Frown, Search, Trophy, X } from "lucide-react";
import { getPublicCategory } from "@/lib/api/elections";
import { NomineeCard } from "@/components/nominees/nominee-card";
import { ElectionStatusBadge } from "@/components/elections/election-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaUrl } from "@/lib/utils";
import { ElectionBannerFallback } from "@/components/elections/election-banner-fallback";

export function CategoryDetailClient({
  slug,
  categoryId,
}: {
  slug: string;
  categoryId: string;
}) {
  const { data: category, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-category", categoryId],
    queryFn: () => getPublicCategory(categoryId),
  });

  const [nomineeSearch, setNomineeSearch] = useState("");

  const filteredNominees = useMemo(() => {
    if (!category) return [];
    const term = nomineeSearch.trim().toLowerCase();
    if (!term) return category.nominees;
    return category.nominees.filter((n) => n.name.toLowerCase().includes(term));
  }, [category, nomineeSearch]);

  if (isLoading) {
    return (
      <div className="container py-16">
        <Skeleton className="mb-6 h-6 w-32" />
        <Skeleton className="h-10 w-1/2" />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !category) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <Frown className="h-10 w-10 text-stone" />
        <h1 className="font-display text-display-sm text-cream">Category not found</h1>
        <p className="max-w-sm text-stone">
          This category doesn&apos;t exist or may have been removed.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
          <Button asChild>
            <Link href={`/elections/${slug}`}>Back to election</Link>
          </Button>
        </div>
      </div>
    );
  }

  const votingOpen = category.election.status === "active";
  const bannerSrc = mediaUrl(category.election.bannerUrl);

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
        <div className="container relative py-14 md:py-18">
          <Link
            href={`/elections/${slug}`}
            className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-stone transition hover:text-champagne"
          >
            <ArrowLeft className="h-4 w-4" />
            {category.election.title}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-4">
              <ElectionStatusBadge status={category.election.status} />
            </div>
            <h1 className="text-balance font-display text-display-md text-cream md:text-display-lg">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone md:text-lg">
                {category.description}
              </p>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-6 border-champagne/35 bg-ink/35 text-champagne shadow-soft hover:border-champagne/60 hover:bg-champagne/10 hover:text-champagne-soft active:bg-champagne/15"
            >
              <Link href={`/elections/${slug}/results`}>
                <Trophy className="h-4 w-4" />
                View live results
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container py-14 md:py-20">
        {category.nominees.length > 0 && (
          <div className="mb-8 flex justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
              <Input
                value={nomineeSearch}
                onChange={(e) => setNomineeSearch(e.target.value)}
                placeholder="Search nominees…"
                aria-label="Search nominees"
                className="pl-9 pr-9"
              />
              {nomineeSearch && (
                <button
                  onClick={() => setNomineeSearch("")}
                  aria-label="Clear search"
                  className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone hover:text-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {category.nominees.length === 0 ? (
          <p className="text-center text-stone">No nominees in this category yet.</p>
        ) : filteredNominees.length === 0 ? (
          <p className="text-center text-stone">No nominees match &quot;{nomineeSearch}&quot;.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredNominees.map((nominee, i) => (
              <NomineeCard
                key={nominee.id}
                nominee={nominee}
                electionId={category.election.id}
                electionTitle={category.election.title}
                pricePerVote={category.election.pricePerVote}
                votingOpen={votingOpen}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
