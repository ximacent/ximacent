"use client";

import { BadgeCheck, Barcode, Layers3, Trophy, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/utils";
import type { Nominee } from "@/lib/api/types";

/**
 * Read-only detail view for a nominee — the primary reason this exists is
 * mobile, where the table only shows "Nominee" + "Actions" columns (code,
 * category, and bio are hidden below the `sm`/`md`/`lg` breakpoints). This
 * is the "View" action's destination, matching the same action-button
 * pattern the categories table uses for its own "View" action.
 */
export function NomineeDetailDialog({
  nominee,
  open,
  onOpenChange,
}: {
  nominee: Nominee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!nominee) return null;

  const imageSrc = mediaUrl(nominee.imageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100vh-2rem))] overflow-y-auto overflow-x-hidden p-0 sm:max-w-2xl">
        <div className="relative overflow-hidden border-b border-border/60 bg-surface-elevated">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(212,165,116,0.18),transparent_38%)]" />
          <div className="relative grid sm:grid-cols-[minmax(190px,0.78fr)_1.22fr]">
            <div className="relative aspect-[1.15/1] min-h-[220px] overflow-hidden bg-secondary sm:aspect-auto sm:min-h-[285px]">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={`${nominee.name} profile`}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(212,165,116,0.14),transparent_55%)]">
                  <UserRound className="h-16 w-16 text-champagne/35" strokeWidth={1.2} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-ink/20" />
            </div>

            <DialogHeader className="relative flex justify-end p-6 pb-7 text-left sm:p-8 sm:pb-9">
              <div className="mb-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">
                <BadgeCheck className="h-4 w-4" />
                <span>Nominee profile</span>
              </div>
              <div className="mt-10 min-w-0 sm:mt-16">
                <DialogTitle className="max-w-[15ch] break-words text-3xl leading-[1.05] text-cream sm:text-4xl">
                  {nominee.name}
                </DialogTitle>
                <DialogDescription className="mt-3 max-w-sm text-sm leading-6 text-stone">
                  A quick view of this nominee&apos;s public profile and election details.
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <section aria-label="Nominee information" className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-secondary/45 p-4 transition-colors hover:border-champagne/30">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-stone">
                <Barcode className="h-4 w-4 text-champagne" />
                <span>Nominee code</span>
              </div>
              <p className="mt-3 break-all font-mono text-lg font-medium tracking-wide text-cream">
                {nominee.code}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-secondary/45 p-4 transition-colors hover:border-champagne/30">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-stone">
                <Layers3 className="h-4 w-4 text-champagne" />
                <span>Category</span>
              </div>
              <p className="mt-3 break-words text-lg font-medium leading-6 text-cream">
                {nominee.category?.name ?? "Unassigned"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-secondary/45 p-4 transition-colors hover:border-champagne/30 sm:col-span-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-stone">
                <Trophy className="h-4 w-4 text-champagne" />
                <span>Election</span>
              </div>
              <p className="mt-3 break-words text-lg font-medium leading-6 text-cream">
                {nominee.category?.election?.title ?? "Unassigned"}
              </p>
            </div>
          </section>

          <section aria-labelledby="nominee-bio-heading" className="border-t border-border/60 pt-5">
            <div className="flex items-center justify-between gap-4">
              <h3 id="nominee-bio-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-stone">
                Biography
              </h3>
              <span className="h-px flex-1 bg-border/50" />
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-cream-muted">
              {nominee.bio || "No biography has been added for this nominee yet."}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
