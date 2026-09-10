"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/types";
import type { PublicNominee } from "@/lib/api/types";

export function VoteDialog({
  open,
  onOpenChange,
  nominee,
  electionTitle,
  pricePerVote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nominee: PublicNominee;
  electionTitle: string;
  pricePerVote: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number | "">(1);
  const [email, setEmail] = useState("");

  const price = Number(pricePerVote);
  // Display-only estimate for the voter's convenience. The real, authoritative
  // amount is always computed server-side — this preview must never be sent
  // to the API or trusted as the actual charge.
  const estimatedTotal = (price * (quantity || 0)).toFixed(2);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createPayment({
        nomineeId: nominee.id,
        quantity: quantity as number,
        voterEmail: email.trim() || undefined,
      }),
    onSuccess: async (data) => {
      // Close OUR dialog BEFORE opening Paystack's popup. Radix's Dialog
      // applies `pointer-events: none` to the rest of the page while open
      // (to enforce its own modal focus-trap), exempting only its own
      // portal content. Paystack's popup is injected as a separate DOM
      // tree outside that portal, so if our dialog were left open behind
      // it, the popup would inherit that disabled state — every element
      // in it shows a "not-allowed" cursor and nothing is clickable.
      onOpenChange(false);

      // Dynamically imported so the Paystack SDK is never touched during
      // server rendering — it's a browser-only library.
      const { default: PaystackPop } = await import("@paystack/inline-js");
      const popup = new PaystackPop();

      popup.resumeTransaction(data.accessCode, {
        onSuccess: () => {
          // Client-side navigation — no full page reload, voter never
          // leaves the site. /vote/complete re-confirms status itself,
          // so this callback alone is never trusted to "deliver value".
          router.push(`/vote/complete?reference=${encodeURIComponent(data.reference)}`);
        },
        onCancel: () => {
          toast.info("Payment cancelled", {
            description: "No charge was made. You can vote again anytime.",
          });
        },
        onError: (error: { message?: string }) => {
          toast.error("Payment error", {
            description: error?.message ?? "Something went wrong during checkout.",
          });
        },
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong starting your payment.";
      toast.error("Couldn't start payment", { description: message });
    },
  });

  function adjustQuantity(delta: number) {
    setQuantity((current) => {
      const next = (current || 1) + delta;
      return Math.max(1, Math.min(999, next));
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vote for {nominee.name}</DialogTitle>
          <DialogDescription>{electionTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label htmlFor="vote-quantity">Number of votes</Label>
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-1)}
                disabled={quantity === "" || quantity <= 1 || isPending}
                aria-label="Decrease votes"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="vote-quantity"
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setQuantity("");
                    return;
                  }

                  const n = Number(value);
                  if (Number.isInteger(n) && n >= 1 && n <= 999) {
                    setQuantity(n);
                  }
                }}
                disabled={isPending}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(1)}
                disabled={isPending}
                aria-label="Increase votes"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-md bg-secondary/50 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="voter-email" className="text-xs text-stone">
                Email <span className="text-stone/70">(optional — for your receipt)</span>
              </Label>
              <Input
                id="voter-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <span className="text-sm text-stone">Estimated total</span>
            <span className="font-display text-xl text-champagne">
              GHS {estimatedTotal}
            </span>
          </div>

          <Button
            className="min-h-11 w-full"
            size="lg"
            onClick={() => mutate()}
            disabled={isPending || quantity === ""}
          >
            {isPending ? "Starting checkout…" : "Continue to secure checkout"}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-stone">
            <ShieldCheck className="h-3.5 w-3.5" />
            Payments are processed securely by Paystack.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
