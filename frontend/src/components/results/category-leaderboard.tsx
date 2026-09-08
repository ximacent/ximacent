import { LeaderboardRow } from "./leaderboard-row";
import type { CategoryResults } from "@/lib/api/types";

export function CategoryLeaderboard({
  results,
  compact = false,
}: {
  results: CategoryResults;
  /** Compact = nested inside an election results page (no outer card chrome). */
  compact?: boolean;
}) {
  const sorted = [...results.nominees].sort((a, b) => b.totalVotes - a.totalVotes);
  const maxVotes = sorted[0]?.totalVotes ?? 0;

  const content = (
    <>
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl text-cream md:text-2xl">
          {results.category.name}
        </h3>
        <span className="whitespace-nowrap text-sm text-stone">
          {results.totalVotes.toLocaleString()} total votes
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-stone">No votes yet in this category.</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((entry, i) => (
            <LeaderboardRow
              key={entry.nomineeId}
              entry={entry}
              rank={i + 1}
              maxVotes={maxVotes}
              index={i}
            />
          ))}
        </div>
      )}
    </>
  );

  if (compact) {
    return <section>{content}</section>;
  }

  return <section className="surface-card p-6 md:p-7">{content}</section>;
}
