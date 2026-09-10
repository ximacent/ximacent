"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { UserRound, Vote as VoteIcon } from "lucide-react";
import { mediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PublicNominee } from "@/lib/api/types";

const VoteDialog = dynamic(
  () => import("@/components/payments/vote-dialog").then((mod) => mod.VoteDialog),
  { ssr: false }
);

function fallbackBio(name: string): string {
  return `${name} is one of the nominees in this category — cast your vote to show your support!`;
}

export function NomineeCard({
  nominee,
  electionTitle,
  pricePerVote,
  votingOpen,
  index = 0,
  priority = false,
}: {
  nominee: PublicNominee;
  electionId: string;
  electionTitle: string;
  pricePerVote: string;
  votingOpen: boolean;
  index?: number;
  priority?: boolean;
}) {
  const [voteOpen, setVoteOpen] = useState(false);
  const imageSrc = mediaUrl(nominee.imageUrl);

  return (
    <>
      <article
        className="surface-card group animate-fade-up flex flex-col overflow-hidden transition duration-300 hover:border-champagne/30 hover:shadow-elevated"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-elevated">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={nominee.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-12 w-12 text-stone/40" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-champagne backdrop-blur-sm">
            {nominee.code}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg text-cream">
            <Link href={`/nominees/${encodeURIComponent(nominee.code)}`} className="focus-ring rounded hover:text-champagne">
              {nominee.name}
            </Link>
          </h3>
          <p
            className={`mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed ${
              nominee.bio ? "text-stone" : "text-stone/70 italic"
            }`}
          >
            {nominee.bio || fallbackBio(nominee.name)}
          </p>

          <Button
            className="mt-4 min-h-11 w-full"
            disabled={!votingOpen}
            onClick={() => setVoteOpen(true)}
          >
            <VoteIcon className="h-4 w-4" />
            {votingOpen ? "Vote for this nominee" : "Voting closed"}
          </Button>
        </div>
      </article>

      {voteOpen && (
        <VoteDialog
          open={voteOpen}
          onOpenChange={setVoteOpen}
          nominee={nominee}
          electionTitle={electionTitle}
          pricePerVote={pricePerVote}
        />
      )}
    </>
  );
}
