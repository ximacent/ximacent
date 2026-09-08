"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Frown, Search, X } from "lucide-react";
import { listPublicElections } from "@/lib/api/elections";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { ElectionCard, ElectionCardSkeleton } from "./election-card";
import { Input } from "@/components/ui/input";

export function ActiveElectionsSection() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["public-elections", { title: debouncedSearch, page: 1, limit: 12 }],
    queryFn: () =>
      listPublicElections({ title: debouncedSearch || undefined, page: 1, limit: 12 }),
  });

  return (
    <section id="elections" className="border-t border-border/40 py-16 md:py-22">
      <div className="container">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h2 className="font-display text-display-sm text-cream md:text-display-md">
              Active elections
            </h2>
            <p className="mt-3 text-stone">
              Pick a contest, choose your favorite, and cast your vote in under a minute.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search elections…"
              aria-label="Search active elections"
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone hover:text-cream"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ElectionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
            <Frown className="h-8 w-8 text-stone" />
            <p className="text-cream-muted">We couldn&apos;t load elections right now.</p>
            <button
              onClick={() => refetch()}
              className="focus-ring rounded text-sm font-medium text-champagne hover:text-champagne-soft"
            >
              Try again
            </button>
          </div>
        )}

        {data && data.elections.length === 0 && (
          <div className="surface-card p-10 text-center">
            <p className="text-cream-muted">
              {debouncedSearch ? (
                `No active elections match "${debouncedSearch}".`
              ) : (
                <>
                  No elections are open for voting right now.
                  <br />
                  Check back soon...
                </>
              )}
            </p>
          </div>
        )}

        {data && data.elections.length > 0 && (
          <div
            className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-150 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            {data.elections.map((election, i) => (
              <ElectionCard key={election.id} election={election} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
