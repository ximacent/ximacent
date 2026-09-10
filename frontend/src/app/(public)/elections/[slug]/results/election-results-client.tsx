"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Frown, RefreshCw, Trophy } from "lucide-react";
import { getPublicElection } from "@/lib/api/elections";
import { getElectionResults } from "@/lib/api/elections";
import { CategoryLeaderboard } from "@/components/results/category-leaderboard";
import { ElectionStatusBadge } from "@/components/elections/election-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Results feel more alive when they self-refresh — this is the one page
// people actually watch update live during an event.
const RESULTS_REFRESH_MS = 15000;

export function ElectionResultsClient({ slug }: { slug: string }) {
  const {
    data: election,
    isLoading: electionLoading,
    isError: electionError,
  } = useQuery({
    queryKey: ["public-election", slug],
    queryFn: () => getPublicElection(slug),
    staleTime: 60_000,
  });

  const {
    data: results,
    isLoading: resultsLoading,
    isError: resultsError,
    isFetching: resultsFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["election-results", election?.id],
    queryFn: () => getElectionResults(election!.id),
    enabled: Boolean(election?.id),
    refetchInterval: RESULTS_REFRESH_MS,
  });

  const isLoading = electionLoading || resultsLoading;
  const isError = electionError || resultsError;

  if (isLoading) {
    return (
      <div className="container py-16">
        <Skeleton className="mb-6 h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <div className="mt-12 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="surface-card space-y-3 p-7">
              <Skeleton className="h-6 w-1/3" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !election || !results) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <Frown className="h-10 w-10 text-stone" />
        <h1 className="font-display text-display-sm text-cream">
          Results unavailable
        </h1>
        <p className="max-w-sm text-stone">
          We couldn&apos;t load results for this election right now.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
        <Button asChild>
          <Link href={`/elections/${slug}`}>Back to election</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(232,197,71,0.08),_transparent_55%)]"
        />
        <div className="container relative py-14 md:py-18">
          <Link
            href={`/elections/${slug}`}
            className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-stone transition hover:text-champagne"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to election
          </Link>

          <div className="animate-fade-up">
            <div className="mb-4 flex items-center gap-3">
              <ElectionStatusBadge status={results.election.status} />
              <span className="inline-flex items-center gap-1.5 text-xs text-stone">
                <RefreshCw
                  className={`h-3 w-3 ${resultsFetching ? "animate-spin" : ""}`}
                />
                Live results
              </span>
            </div>

            <h1 className="text-balance font-display text-display-md text-cream md:text-display-lg">
              {results.election.title}
            </h1>

            <div
              aria-live="polite"
              aria-atomic="true"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-4 py-1.5"
            >
              <Trophy className="h-4 w-4 text-gold" />
              <span className="font-display text-lg text-gold">
                {results.totalVotes.toLocaleString()}
              </span>
              <span className="text-sm text-stone">total votes cast</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container space-y-8 py-14 md:py-18">
        {results.categories.length === 0 ? (
          <div className="surface-card p-10 text-center text-stone">
            No categories to show results for yet.
          </div>
        ) : (
          results.categories.map((category) => (
            <CategoryLeaderboard key={category.category.id} results={category} />
          ))
        )}
      </div>
    </div>
  );
}
