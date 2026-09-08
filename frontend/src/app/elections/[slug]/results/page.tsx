import type { Metadata } from "next";
import { ElectionResultsClient } from "./election-results-client";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Live results" };

export default async function ElectionResultsPage({ params }: Props) {
  const { slug } = await params;
  return <ElectionResultsClient slug={slug} />;
}
