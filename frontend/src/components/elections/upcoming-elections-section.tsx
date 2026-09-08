"use client";

import { useQuery } from "@tanstack/react-query";
import { listUpcomingElections } from "@/lib/api/elections";
import { UpcomingElectionCard, ElectionCardSkeleton } from "./election-card";

export function UpcomingElectionsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-elections-upcoming", { page: 1, limit: 6 }],
    queryFn: () => listUpcomingElections({ page: 1, limit: 6 }),
  });

  // Silent on error/empty — this is a secondary section; a loud error state
  // here would compete with the primary active-elections section above it.
  if (isError) return null;
  if (!isLoading && (!data || data.elections.length === 0)) return null;

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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <ElectionCardSkeleton key={i} />)
            : data!.elections.map((election, i) => (
                <UpcomingElectionCard key={election.id} election={election} index={i} />
              ))}
        </div>
      </div>
    </section>
  );
}
