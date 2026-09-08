"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { UserRound, Vote as VoteIcon } from "lucide-react";
import { mediaUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoteDialog } from "@/components/payments/vote-dialog";
import type { PublicNominee } from "@/lib/api/types";

function fallbackBio(name: string): string {
  return `${name} is one of the nominees in this category — cast your vote to show your support!`;
}

export function NomineeCard({
  nominee,
  electionId,
  electionTitle,
  pricePerVote,
  votingOpen,
  index = 0,
}: {
  nominee: PublicNominee;
  electionId: string;
  electionTitle: string;
  pricePerVote: string;
  votingOpen: boolean;
  index?: number;
}) {
  const [voteOpen, setVoteOpen] = useState(false);
  const imageSrc = mediaUrl(nominee.imageUrl);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
        className="surface-card group flex flex-col overflow-hidden transition duration-300 hover:border-champagne/30 hover:shadow-elevated"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-elevated">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={nominee.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
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
          <h4 className="font-display text-lg text-cream">{nominee.name}</h4>
          <p
            className={`mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed ${
              nominee.bio ? "text-stone" : "text-stone/70 italic"
            }`}
          >
            {nominee.bio || fallbackBio(nominee.name)}
          </p>

          <Button
            className="mt-4 w-full"
            disabled={!votingOpen}
            onClick={() => setVoteOpen(true)}
          >
            <VoteIcon className="h-4 w-4" />
            {votingOpen ? "Vote for this nominee" : "Voting closed"}
          </Button>
        </div>
      </motion.article>

      <VoteDialog
        open={voteOpen}
        onOpenChange={setVoteOpen}
        nominee={nominee}
        electionTitle={electionTitle}
        pricePerVote={pricePerVote}
      />
    </>
  );
}
