import type { Metadata } from "next";
import { VoteByCodeClient } from "./vote-by-code-client";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = {
  title: "Vote",
  robots: { index: false, follow: false },
};

export default async function VoteByCodePage({ params }: Props) {
  const { code } = await params;
  return <VoteByCodeClient code={code} />;
}