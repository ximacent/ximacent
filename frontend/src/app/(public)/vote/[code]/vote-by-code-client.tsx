"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Frown, Loader2, UserRound } from "lucide-react";
import { getNomineeByCode } from "@/lib/api/nominees";
import { ApiError } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoteDialog } from "@/components/payments/vote-dialog";
import { ElectionStatusBadge } from "@/components/elections/election-status-badge";

export function VoteByCodeClient({ code }: { code: string }) {
  const [voteDismissed, setVoteDismissed] = useState(false);
  const { data: nominee, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public-nominee-by-code", code.toUpperCase()],
    queryFn: () => getNomineeByCode(code.trim().toUpperCase()),
  });

  if (isLoading) {
    return (
      <Dialog open onOpenChange={() => undefined}>
        <DialogContent showClose={false} aria-describedby="vote-by-code-loading-description">
          <DialogHeader>
            <DialogTitle>Preparing your vote</DialogTitle>
            <DialogDescription id="vote-by-code-loading-description">
              We&apos;re loading the nominee details. Please wait a moment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-5" role="status" aria-live="polite">
            <Loader2 className="h-7 w-7 animate-spin text-champagne" aria-hidden="true" />
            <span className="sr-only">Loading nominee details</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !nominee) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <Frown className="h-10 w-10 text-stone" />
        <h1 className="font-display text-display-sm text-cream">
          {notFound ? "Nominee not found" : "Unable to load nominee"}
        </h1>
        <p className="max-w-md text-stone">
          {notFound
            ? "That code is invalid, or its election is not available for voting yet."
            : "We couldn't load this nominee right now. Please try again."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {!notFound && (
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          )}
          <Button asChild>
            <Link href="/">Back to elections</Link>
          </Button>
        </div>
      </div>
    );
  }

  const imageSrc = mediaUrl(nominee.imageUrl);
  const votingOpen = nominee.election.status === "active";
  const voteOpen = votingOpen && !voteDismissed;

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <Link
        href="/"
        className="focus-ring inline-flex items-center gap-1.5 rounded text-sm font-medium text-stone transition hover:text-champagne"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to elections
      </Link>

      <article className="surface-card mt-8 overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
          {imageSrc ? (
            <Image src={imageSrc} alt={nominee.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UserRound className="h-16 w-16 text-stone/40" />
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-champagne/10 px-2.5 py-1 text-xs font-medium tracking-wide text-champagne">
              {nominee.code}
            </span>
            <ElectionStatusBadge status={nominee.election.status} />
          </div>
          <h1 className="mt-4 font-display text-display-md text-cream">{nominee.name}</h1>
          <p className="mt-2 text-stone">
            {nominee.category.name} · {nominee.election.title}
          </p>
          {nominee.bio && <p className="mt-6 max-w-2xl leading-relaxed text-stone">{nominee.bio}</p>}

          <div className="mt-8 border-t border-border/50 pt-6">
            {votingOpen ? (
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setVoteDismissed(false)}>
                Vote for {nominee.name}
              </Button>
            ) : (
              <div className="rounded-md border border-border/60 bg-secondary/40 p-4 text-sm text-stone">
                Voting is not currently open for this election. Please check back when the election is active.
              </div>
            )}
          </div>
        </div>
      </article>

      <VoteDialog
        open={voteOpen}
        onOpenChange={(open) => setVoteDismissed(!open)}
        nominee={nominee}
        electionTitle={nominee.election.title}
        pricePerVote={nominee.election.pricePerVote}
      />
    </div>
  );
}