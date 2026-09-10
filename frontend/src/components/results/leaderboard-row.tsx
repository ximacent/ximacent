import Image from "next/image";
import { Crown, UserRound } from "lucide-react";
import { mediaUrl, cn } from "@/lib/utils";

interface LeaderboardEntry {
  nomineeId: string;
  name: string;
  code: string;
  imageUrl: string | null;
  totalVotes: number;
}

export function LeaderboardRow({
  entry,
  rank,
  maxVotes,
  index = 0,
}: {
  entry: LeaderboardEntry;
  rank: number;
  maxVotes: number;
  index?: number;
}) {
  const isFirst = rank === 1;
  const barWidth = maxVotes > 0 ? Math.max(4, (entry.totalVotes / maxVotes) * 100) : 0;
  const imageSrc = mediaUrl(entry.imageUrl);

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-lg border p-3.5 transition sm:gap-4 sm:p-4 animate-fade-up",
        isFirst
          ? "border-gold/30 bg-gold/[0.06] shadow-glow"
          : "border-border/60 bg-card/60"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 -z-0 transition-all duration-700 ease-out",
          isFirst ? "bg-gold/10" : "bg-champagne/[0.06]"
        )}
        style={{ width: `${barWidth}%` }}
      />

      <div className="relative z-10 flex w-8 flex-shrink-0 items-center justify-center">
        {isFirst ? (
          <Crown className="h-5 w-5 text-gold" />
        ) : (
          <span className="font-display text-lg text-stone">{rank}</span>
        )}
      </div>

      <div className="relative z-10 h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-border/50 sm:h-14 sm:w-14">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={entry.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound className="h-6 w-6 text-stone/40" />
          </div>
        )}
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <p className="truncate font-display text-base text-cream sm:text-lg">
          {entry.name}
        </p>
        <p className="text-xs text-stone">{entry.code}</p>
      </div>

      <div className="relative z-10 flex-shrink-0 text-right">
        <p
          className={cn(
            "font-display text-lg tabular-nums sm:text-xl",
            isFirst ? "text-gold" : "text-champagne"
          )}
        >
          {entry.totalVotes.toLocaleString()}
        </p>
        <p className="text-[11px] text-stone">votes</p>
      </div>
    </div>
  );
}
