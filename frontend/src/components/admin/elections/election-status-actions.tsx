"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateElectionStatus } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import type { Election } from "@/lib/api/types";
import { Textarea } from "@/components/ui/textarea";

export function ElectionStatusActions({
  election,
  size = "sm",
}: {
  election: Election;
  size?: "sm" | "default";
}) {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState<"approve" | "reject" | "activate" | "close" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: ({ status, rejectionReason: reason }: { status: "approved" | "rejected" | "active" | "closed"; rejectionReason?: string }) =>
      updateElectionStatus(election.id, { status, rejectionReason: reason }),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-elections"] });
      queryClient.invalidateQueries({ queryKey: ["admin-election", election.id] });
      toast.success(status === "approved" ? "Election approved" : status === "rejected" ? "Election rejected" : status === "active" ? "Election activated" : "Election closed", {
        description:
          status === "approved"
            ? "The organizer can now prepare the approved election for launch."
            : status === "rejected"
              ? "The organizer will be able to update and resubmit the election."
              : status === "active"
            ? "Voting is now open to the public."
            : "Voting has stopped for good.",
      });
      setOpenDialog(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't update status", { description: message });
    },
  });

  if (election.status === "pending_review") {
    return (
      <div className="flex flex-wrap gap-2">
        <AlertDialog open={openDialog === "approve"} onOpenChange={(open) => !isPending && setOpenDialog(open ? "approve" : null)}>
          <AlertDialogTrigger asChild><Button type="button" variant="outline" size={size}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button></AlertDialogTrigger>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve “{election.title}”?</AlertDialogTitle><AlertDialogDescription>This moves the election to approved. It still needs a separate launch action before voting opens.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isPending} onClick={() => mutate({ status: "approved" })}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve election"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={openDialog === "reject"} onOpenChange={(open) => !isPending && setOpenDialog(open ? "reject" : null)}>
          <AlertDialogTrigger asChild><Button type="button" variant="outline" size={size} className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"><XCircle className="h-3.5 w-3.5" />Reject</Button></AlertDialogTrigger>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Request changes to “{election.title}”</AlertDialogTitle><AlertDialogDescription>Give the organizer a clear reason so they know what to fix before resubmitting.</AlertDialogDescription></AlertDialogHeader><Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what needs to change" /><AlertDialogFooter><AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={isPending || !rejectionReason.trim()} onClick={() => mutate({ status: "rejected", rejectionReason: rejectionReason.trim() })}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject election"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (election.status === "approved") {
    return (
      <AlertDialog
        open={openDialog === "activate"}
        onOpenChange={(open) => !isPending && setOpenDialog(open ? "activate" : null)}
      >
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" size={size}>
            <Play className="h-3.5 w-3.5" />
            Activate
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate &ldquo;{election.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This opens voting to the public right away. If the start date is still in the
              future it will snap to now. The election needs at least one category with
              nominees, or activation will be rejected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={() => mutate({ status: "active" })}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate election"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (election.status === "active") {
    return (
      <AlertDialog
        open={openDialog === "close"}
        onOpenChange={(open) => !isPending && setOpenDialog(open ? "close" : null)}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size}
            className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
          >
            <Lock className="h-3.5 w-3.5" />
            Close
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close &ldquo;{election.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This stops voting immediately and can&apos;t be undone or reopened. Only do this
              once the election is truly over.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => mutate({ status: "closed" })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Close election"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
