import type { Metadata } from "next";
import { getPublicElection } from "@/lib/api/elections";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, electionStateLabel, trimDescription } from "@/lib/seo";
import { ElectionDetailClient } from "./election-detail-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const election = await getPublicElection(slug);
    const state = electionStateLabel(election.status);
    const description = trimDescription(
      election.description ?? "",
      `${state} in ${election.title}. Browse categories, support nominees, and follow live results.`,
    );
    return {
      title: `${election.title} | ${state}`,
      description,
      alternates: { canonical: `/elections/${election.slug}` },
      openGraph: {
        title: `${election.title} | ${state}`,
        description,
        url: `/elections/${election.slug}`,
        images: election.bannerUrl ? [{ url: election.bannerUrl }] : ["/opengraph-image.png"],
      },
    };
  } catch {
    return { title: "Online Election Voting" };
  }
}

export default async function ElectionDetailPage({ params }: Props) {
  const { slug } = await params;
  let election: Awaited<ReturnType<typeof getPublicElection>> | null = null;
  try {
    election = await getPublicElection(slug);
  } catch {
    // The client page retains its existing not-found/error experience.
  }

  return (
    <>
      {election && (
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Event",
              name: election.title,
              description: election.description ?? `Online voting for ${election.title}.`,
              url: absoluteUrl(`/elections/${election.slug}`),
              startDate: election.startDate,
              endDate: election.endDate,
              eventStatus:
                election.status === "closed"
                  ? "https://schema.org/EventCompleted"
                  : "https://schema.org/EventScheduled",
              eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
              location: {
                "@type": "VirtualLocation",
                url: absoluteUrl(`/elections/${election.slug}`),
              },
              image: election.bannerUrl ? [election.bannerUrl] : [absoluteUrl("/opengraph-image.png")],
              organizer: { "@type": "Organization", name: "Ximacent", url: absoluteUrl("/") },
              offers: {
                "@type": "Offer",
                price: election.pricePerVote,
                priceCurrency: "GHS",
                availability:
                  election.status === "active"
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: absoluteUrl(`/elections/${election.slug}`),
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: election.title, item: absoluteUrl(`/elections/${election.slug}`) },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `${election.title} categories`,
              itemListElement: election.categories.map((category, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: category.name,
                url: absoluteUrl(`/elections/${election.slug}/categories/${category.id}`),
              })),
            },
          ]}
        />
      )}
      <ElectionDetailClient slug={slug} initialElection={election ?? undefined} />
    </>
  );
}