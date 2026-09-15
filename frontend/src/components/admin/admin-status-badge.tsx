import { cn } from "@/lib/utils";
import type { ElectionStatus } from "@/lib/api/types";

const STATUS_STYLES: Record<ElectionStatus, string> = {
  draft: "bg-secondary text-stone ring-1 ring-border",
  pending_review: "bg-champagne/15 text-champagne ring-1 ring-champagne/30",
  approved: "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25",
  rejected: "bg-rose/15 text-rose-soft ring-1 ring-rose/25",
  active: "bg-gold/15 text-gold ring-1 ring-gold/30",
  closed: "bg-rose/15 text-rose-soft ring-1 ring-rose/25",
};

const STATUS_LABELS: Record<ElectionStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  closed: "Closed",
};

/** Literal status labels for the control panel — see ElectionStatusBadge for the public-facing copy. */
export function AdminStatusBadge({ status }: { status: ElectionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" && "animate-pulse bg-gold",
          status === "draft" && "bg-stone",
          status === "pending_review" && "bg-champagne",
          status === "approved" && "bg-emerald-400",
          status === "rejected" && "bg-rose",
          status === "closed" && "bg-rose"
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
