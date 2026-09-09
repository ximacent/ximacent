"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Search, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getNomineeByCode } from "@/lib/api/nominees";
import { ApiError, type NomineeByCodeResult } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";

export function VoteByCodeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<NomineeByCodeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => getNomineeByCode(code.trim().toUpperCase()),
    onSuccess: (nominee) => {
      setResult(nominee);
      setErrorMessage(null);
    },
    onError: (error) => {
      setResult(null);
      setErrorMessage(
        error instanceof ApiError && error.status === 404
          ? "We couldn't find a nominee with that code. Check the code and try again."
          : "We couldn't look up that code right now. Please try again."
      );
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCode("");
      setResult(null);
      setErrorMessage(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || isPending) return;
    setErrorMessage(null);
    mutate();
  }

  const imageSrc = result ? mediaUrl(result.imageUrl) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vote by nominee code</DialogTitle>
          <DialogDescription>
            Enter the unique code shown on your nominee&apos;s voting materials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. MIS0007"
              aria-label="Nominee voting code"
              aria-invalid={Boolean(errorMessage)}
              disabled={isPending}
              className="min-w-0 uppercase tracking-wider"
            />
            <Button type="submit" disabled={!code.trim() || isPending}>
              <Search className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">
                {isPending ? "Searching" : "Search"}
              </span>
            </Button>
          </div>

          {isPending && <p className="text-sm text-stone" role="status">Looking up nominee...</p>}
          {errorMessage && <p className="text-sm text-rose-soft" role="alert">{errorMessage}</p>}

          {result && (
            <Link
              href={`/vote/${encodeURIComponent(result.code)}`}
              onClick={() => handleOpenChange(false)}
              className="focus-ring flex items-center gap-3 rounded-md border border-champagne/30 bg-secondary/50 p-3 transition hover:border-champagne/60 hover:bg-secondary"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-elevated">
                {imageSrc ? (
                  <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-5 w-5 text-stone" />
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base text-cream">
                  {result.name}
                </span>
                <span className="block truncate text-xs text-stone">
                  {result.code} · {result.category.name}
                </span>
                <span className="block truncate text-xs text-stone">{result.election.title}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-champagne" />
            </Link>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}