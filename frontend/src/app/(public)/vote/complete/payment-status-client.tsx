"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentStatus, confirmPayment } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 20000;
const CONFIRM_FALLBACK_LABEL = "Checking with our payment provider…";

type Phase = "polling" | "confirming" | "success" | "failed" | "missing-reference";

export function PaymentStatusClient({ reference }: { reference: string | null }) {
  const [phase, setPhase] = useState<Phase>(reference ? "polling" : "missing-reference");
  const [detail, setDetail] = useState<{ amount?: string; quantity?: number }>({});
  const attemptedFallback = useRef(false);
  const startedAt = useRef(Date.now());

  const { data, refetch } = useQuery({
    queryKey: ["payment-status", reference],
    queryFn: () => getPaymentStatus(reference as string),
    enabled: Boolean(reference) && (phase === "polling" || phase === "confirming"),
    refetchInterval: phase === "polling" ? POLL_INTERVAL_MS : false,
  });

  useEffect(() => {
    if (!data) return;

    setDetail({ amount: data.amount, quantity: data.quantity });

    if (data.status === "success") {
      setPhase("success");
      return;
    }

    if (data.status === "failed") {
      setPhase("failed");
      return;
    }

    // still pending — check whether we've timed out waiting on the webhook
    const elapsed = Date.now() - startedAt.current;
    if (elapsed >= POLL_TIMEOUT_MS && !attemptedFallback.current && reference) {
      attemptedFallback.current = true;
      setPhase("confirming");
      confirmPayment(reference)
        .then(() => refetch())
        .catch(() => refetch());
    }
  }, [data, reference, refetch]);

  if (phase === "missing-reference") {
    return (
      <StatusShell
        icon={<XCircle className="h-12 w-12 text-rose" />}
        title="No payment reference found"
        description="This page is meant to be reached after completing checkout. If you just paid, check your email or try voting again."
      />
    );
  }

  if (phase === "success") {
    return (
      <StatusShell
        icon={<CheckCircle2 className="h-12 w-12 text-gold" />}
        title="Vote confirmed!"
        description={
          detail.quantity
            ? `Your ${detail.quantity} vote${detail.quantity > 1 ? "s" : ""} ${
                detail.amount ? `(GHS ${detail.amount}) ` : ""
              }have been counted. Thank you for participating.`
            : "Your vote has been counted. Thank you for participating."
        }
        tone="success"
      />
    );
  }

  if (phase === "failed") {
    return (
      <StatusShell
        icon={<XCircle className="h-12 w-12 text-rose" />}
        title="Payment didn't go through"
        description="Your payment wasn't completed, so no vote was recorded. No charge should apply — please try again."
      />
    );
  }

  return (
    <StatusShell
      icon={<Loader2 className="h-12 w-12 animate-spin text-champagne" />}
      title={phase === "confirming" ? "Almost there…" : "Confirming your payment…"}
      description={
        phase === "confirming"
          ? CONFIRM_FALLBACK_LABEL
          : "This usually takes just a few seconds. Please don't close this page."
      }
    />
  );
}

function StatusShell({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "success";
}) {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-card w-full max-w-md p-10 text-center shadow-elevated"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/70">
          {icon}
        </div>
        <h1 className="font-display text-display-sm text-cream">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">{description}</p>

        {tone === "success" ? (
          <Button asChild className="mt-8 w-full">
            <Link href="/">Back to elections</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="mt-8 w-full">
            <Link href="/">Return home</Link>
          </Button>
        )}
      </motion.div>
    </div>
  );
}
