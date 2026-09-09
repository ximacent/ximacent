import type { Metadata } from "next";
import { ElectionDetailClient } from "./election-detail-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug
      .split("-")
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" "),
  };
}

export default async function ElectionDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ElectionDetailClient slug={slug} />;
}
