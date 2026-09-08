"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Users } from "lucide-react";
import type { PublicCategory } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";
import { ElectionBannerFallback } from "@/components/elections/election-banner-fallback";

export function CategoryCard({
  category,
  electionSlug,
  bannerUrl,
  index = 0,
}: {
  category: PublicCategory;
  electionSlug: string;
  /** The parent election's banner — used as this card's background. */
  bannerUrl?: string | null;
  index?: number;
}) {
  const nomineeCount = category.nominees.length;
  const bannerSrc = mediaUrl(bannerUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
    >
      <Link
        href={`/elections/${electionSlug}/categories/${category.id}`}
        className="group focus-ring block overflow-hidden rounded-lg"
      >
        <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-white/10 p-6 shadow-soft ring-1 ring-black/20 transition duration-300 hover:-translate-y-1 hover:border-champagne/40 hover:shadow-elevated">
          {/* Background layer — same footprint as the card itself, not a
              separate image block, so the card's size never changes. */}
          <div className="absolute inset-0 -z-10">
            {bannerSrc ? (
              <Image
                src={bannerSrc}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <ElectionBannerFallback />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/70 to-ink/90" />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/60 px-2.5 py-1 text-xs text-cream-muted backdrop-blur-sm">
                <Users className="h-3.5 w-3.5" />
                {nomineeCount} {nomineeCount === 1 ? "nominee" : "nominees"}
              </span>
            </div>

            <h3 className="font-display text-xl text-cream transition group-hover:text-champagne-soft md:text-2xl">
              {category.name}
            </h3>

            {category.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream-muted">
                {category.description}
              </p>
            )}
          </div>

          <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-champagne/30 bg-champagne/15 px-3 py-1.5 text-xs font-medium text-champagne backdrop-blur-sm transition group-hover:bg-champagne/25 group-hover:border-champagne/50">
            View Nominees
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
