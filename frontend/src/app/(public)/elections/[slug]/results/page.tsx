import type { Metadata } from "next";
import { getPublicElection } from "@/lib/api/elections";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, electionStateLabel, trimDescription } from "@/lib/seo";
import { ElectionResultsClient } from "./election-results-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const election = await getPublicElection(slug);
    const state = electionStateLabel(election.status);
    const description = trimDescription(
      `View ${state.toLowerCase()} for ${election.title}, including category leaderboards and nominee vote totals.`,
      `View results for ${election.title}.`,
    );
    return {
      title: `${election.title} Results`,
      description,
      alternates: { canonical: `/elections/${election.slug}/results` },
      openGraph: { title: `${election.title} Results`, description, url: `/elections/${election.slug}/results` },
    };
  } catch {
    return { title: "Election Results" };
  }
}

export default async function ElectionResultsPage({ params }: Props) {
  const { slug } = await params;
  let election: Awaited<ReturnType<typeof getPublicElection>> | null = null;
  try {
    election = await getPublicElection(slug);
  } catch {
    // The client page retains its existing error experience.
  }
  return (
    <>
      {election && (
        <JsonLd
          data={[
            {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${election.title} Results`,
            url: absoluteUrl(`/elections/${election.slug}/results`),
            isPartOf: { "@type": "WebSite", name: "Ximacent", url: absoluteUrl("/") },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: election.title, item: absoluteUrl(`/elections/${election.slug}`) },
                { "@type": "ListItem", position: 3, name: "Results", item: absoluteUrl(`/elections/${election.slug}/results`) },
              ],
            },
          ]}
        />
      )}
      <ElectionResultsClient slug={slug} initialElection={election ?? undefined} />
    </>
  );
}
