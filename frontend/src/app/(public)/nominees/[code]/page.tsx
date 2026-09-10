import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { getNomineeByCode } from "@/lib/api/nominees";
import { mediaUrl } from "@/lib/utils";
import { absoluteUrl, electionStateLabel, trimDescription } from "@/lib/seo";

type Props = { params: Promise<{ code: string }> };

async function getNominee(code: string) {
  return getNomineeByCode(code);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  try {
    const nominee = await getNominee(code);
    const state = electionStateLabel(nominee.election.status);
    const title = `${nominee.name} | ${nominee.category.name} | ${nominee.election.title}`;
    const description = trimDescription(
      `Meet ${nominee.name}, a nominee in the ${nominee.category.name} category of ${nominee.election.title}. ${state} and support this nominee online.`,
      `View ${nominee.name}'s nominee profile.`,
    );
    return {
      title,
      description,
      alternates: { canonical: `/nominees/${encodeURIComponent(nominee.code)}` },
      openGraph: {
        title,
        description,
        url: `/nominees/${encodeURIComponent(nominee.code)}`,
        images: nominee.imageUrl ? [{ url: nominee.imageUrl }] : ["/opengraph-image.png"],
      },
    };
  } catch {
    return { title: "Nominee Profile" };
  }
}

export default async function NomineePage({ params }: Props) {
  const { code } = await params;
  let nominee;
  try {
    nominee = await getNominee(code);
  } catch {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="font-display text-display-sm text-cream">Nominee not found</h1>
        <p className="max-w-md text-stone">This nominee profile is no longer available.</p>
        <Button asChild variant="outline"><Link href="/">Back to elections</Link></Button>
      </div>
    );
  }

  const imageSrc = mediaUrl(nominee.imageUrl);
  const electionPath = `/elections/${nominee.election.slug}`;
  const categoryPath = `${electionPath}/categories/${nominee.category.id}`;

  return (
    <div className="container py-12 md:py-20">
      <JsonLd
        data={[
          {
          "@context": "https://schema.org",
          "@type": "Person",
          name: nominee.name,
          description: nominee.bio ?? undefined,
          image: imageSrc ? [imageSrc] : undefined,
          url: absoluteUrl(`/nominees/${encodeURIComponent(nominee.code)}`),
          memberOf: { "@type": "Thing", name: nominee.election.title },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: nominee.election.title, item: absoluteUrl(electionPath) },
              { "@type": "ListItem", position: 3, name: nominee.category.name, item: absoluteUrl(categoryPath) },
              { "@type": "ListItem", position: 4, name: nominee.name, item: absoluteUrl(`/nominees/${encodeURIComponent(nominee.code)}`) },
            ],
          },
        ]}
      />
      <Link href={categoryPath} className="focus-ring inline-flex items-center gap-1.5 rounded text-sm text-stone hover:text-champagne">
        <ArrowLeft className="h-4 w-4" />
        {nominee.category.name}
      </Link>

      <article className="mt-8 grid gap-8 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border/60 bg-secondary">
          {imageSrc ? <Image src={imageSrc} alt={`${nominee.name} profile`} fill sizes="(max-width: 1024px) 100vw, 360px" className="object-cover" priority /> : <UserRound className="absolute inset-0 m-auto h-16 w-16 text-stone/40" />}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne">{nominee.category.name}</p>
          <h1 className="mt-3 font-display text-display-md text-cream">{nominee.name}</h1>
          <p className="mt-3 text-stone">{nominee.election.title}</p>
          {nominee.bio && <p className="mt-8 max-w-2xl whitespace-pre-line text-base leading-8 text-stone">{nominee.bio}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {nominee.election.status === "active" ? (
              <Button asChild>
                <Link href={`/vote/${encodeURIComponent(nominee.code)}`}>
                  Vote for this nominee
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-2.5 text-sm text-stone">
                Voting closed
              </span>
            )}
            <Button asChild variant="outline"><Link href={`${electionPath}/results`}>View results</Link></Button>
          </div>
        </div>
      </article>
    </div>
  );
}
