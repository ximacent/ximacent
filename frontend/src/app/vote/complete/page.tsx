import type { Metadata } from "next";
import { PaymentStatusClient } from "./payment-status-client";

export const metadata: Metadata = { title: "Confirming your vote" };

type Props = { searchParams: Promise<{ reference?: string }> };

export default async function VoteCompletePage({ searchParams }: Props) {
  const { reference } = await searchParams;
  return <PaymentStatusClient reference={reference ?? null} />;
}
