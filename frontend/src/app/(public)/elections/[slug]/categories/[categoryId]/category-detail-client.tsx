"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Frown, Search, X } from "lucide-react";
import { getPublicCategory } from "@/lib/api/elections";
import type { PublicCategoryDetail } from "@/lib/api/types";
import { NomineeCard } from "@/components/nominees/nominee-card";
import { ElectionStatusBadge } from "@/components/elections/election-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LiveResultsLink } from "@/components/elections/live-results-link";
import { Input } from "@/components/ui/input";
import { mediaUrl } from "@/lib/utils";
import { ElectionBannerFallback } from "@/components/elections/election-banner-fallback";

export function CategoryDetailClient({
  slug,
  categoryId,
  initialCategory,
}: {
  slug: string;
  categoryId: string;
  initialCategory?: PublicCategoryDetail;
}) {
  const { data: category, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-category", categoryId],
    queryFn: () => getPublicCategory(categoryId),
    initialData: initialCategory,
    staleTime: 60_000,
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
      <div>
        <div className="relative min-h-[14rem] overflow-hidden border-b border-border/40 md:min-h-[18rem]">
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
        <div className="container py-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full" />
            ))}
          </div>
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
      <section className="relative min-h-[14rem] overflow-hidden border-b border-border/40 md:min-h-[18rem]">
        {bannerSrc ? (
          <>
            <Image
              src={bannerSrc}
              alt={`${category.election.title} banner`}
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

          <div className="animate-fade-up">
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

            <div className="mt-6">
              <LiveResultsLink slug={slug} />
            </div>
          </div>
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
                  className="focus-ring absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-stone hover:text-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {category.nominees.length === 0 ? (
          <div className="surface-card p-10 text-center text-stone">
            No nominees in this category yet.
          </div>
        ) : filteredNominees.length === 0 ? (
          <div className="surface-card p-10 text-center text-stone">
            No nominees match &quot;{nomineeSearch}&quot;.
          </div>
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
                priority={i < 4}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
