import type { Metadata } from "next";
import { CategoryDetailClient } from "./category-detail-client";

type Props = { params: Promise<{ slug: string; categoryId: string }> };

export const metadata: Metadata = { title: "Vote" };

export default async function CategoryDetailPage({ params }: Props) {
  const { slug, categoryId } = await params;
  return <CategoryDetailClient slug={slug} categoryId={categoryId} />;
}
