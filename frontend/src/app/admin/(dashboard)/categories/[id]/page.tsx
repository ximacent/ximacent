import type { Metadata } from "next";
import { CategoryDetailClient } from "./category-detail-client";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Category" };

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  return <CategoryDetailClient id={id} />;
}
