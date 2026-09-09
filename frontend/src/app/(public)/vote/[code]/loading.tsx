import { Loader2 } from "lucide-react";

export default function VoteByCodeLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-elevated">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-champagne" aria-hidden="true" />
        <p className="mt-4 font-display text-lg text-cream">Preparing your vote</p>
        <p className="mt-2 text-sm text-stone">Loading nominee details. Please wait a moment.</p>
      </div>
    </div>
  );
}