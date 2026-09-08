import { cn } from "@/lib/utils";
import type { ElectionStatus } from "@/lib/api/types";

const STATUS_STYLES: Record<ElectionStatus, string> = {
  draft: "bg-secondary text-stone ring-1 ring-border",
  active: "bg-gold/15 text-gold ring-1 ring-gold/30",
  closed: "bg-rose/15 text-rose-soft ring-1 ring-rose/25",
};

const STATUS_LABELS: Record<ElectionStatus, string> = {
  draft: "Coming soon",
  active: "Voting open",
  closed: "Voting closed",
};

export function ElectionStatusBadge({
  status,
  className,
}: {
  status: ElectionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" && "animate-pulse bg-gold",
          status === "draft" && "bg-stone",
          status === "closed" && "bg-rose"
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
