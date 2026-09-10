import type { Metadata } from "next";
import { getPublicCategory } from "@/lib/api/elections";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, electionStateLabel, trimDescription } from "@/lib/seo";
import { CategoryDetailClient } from "./category-detail-client";

type Props = { params: Promise<{ slug: string; categoryId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, categoryId } = await params;
  try {
    const category = await getPublicCategory(categoryId);
    const state = electionStateLabel(category.election.status);
    const description = trimDescription(
      category.description ?? "",
      `${state} in the ${category.name} category of ${category.election.title}. View nominees and cast your vote online.`,
    );
    return {
      title: `${category.name} | ${category.election.title}`,
      description,
      alternates: { canonical: `/elections/${slug}/categories/${categoryId}` },
      openGraph: {
        title: `${category.name} | ${category.election.title}`,
        description,
        url: `/elections/${slug}/categories/${categoryId}`,
        images: category.election.bannerUrl ? [{ url: category.election.bannerUrl }] : ["/opengraph-image.png"],
      },
    };
  } catch {
    return { title: "Online Voting Category" };
  }
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug, categoryId } = await params;
  let category: Awaited<ReturnType<typeof getPublicCategory>> | null = null;
  try {
    category = await getPublicCategory(categoryId);
  } catch {
    // The client page retains its existing not-found/error experience.
  }
  return (
    <>
      {category && (
        <JsonLd
          data={[
            {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${category.name} nominees`,
            itemListElement: category.nominees.map((nominee, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: nominee.name,
              url: absoluteUrl(`/nominees/${encodeURIComponent(nominee.code)}`),
            })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: category.election.title, item: absoluteUrl(`/elections/${slug}`) },
                { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(`/elections/${slug}/categories/${category.id}`) },
              ],
            },
          ]}
        />
      )}
      <CategoryDetailClient slug={slug} categoryId={categoryId} initialCategory={category ?? undefined} />
    </>
  );
}
