"use client";

import { useQuery } from "@tanstack/react-query";
import { Frown } from "lucide-react";
import { listUpcomingElections } from "@/lib/api/elections";
import { UpcomingElectionCard, ElectionCardSkeleton } from "./election-card";

export function UpcomingElectionsSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-elections-upcoming", { page: 1, limit: 6 }],
    queryFn: () => listUpcomingElections({ page: 1, limit: 6 }),
    staleTime: 5 * 60_000,
  });

  if (!isLoading && !isError && (!data || data.elections.length === 0)) return null;

  return (
    <section className="border-t border-border/40 py-16 md:py-22">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-display-sm text-cream md:text-display-md">
            Upcoming
          </h2>
          <p className="mt-3 text-stone">
            These elections haven&apos;t opened for voting yet — check back soon.
          </p>
        </div>

        {isError ? (
          <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
            <Frown className="h-8 w-8 text-stone" />
            <p className="text-cream-muted">We couldn&apos;t load upcoming elections.</p>
            <button
              onClick={() => refetch()}
              className="focus-ring rounded text-sm font-medium text-champagne hover:text-champagne-soft"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <ElectionCardSkeleton key={i} />)
              : data!.elections.map((election, i) => (
                  <UpcomingElectionCard key={election.id} election={election} index={i} />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
