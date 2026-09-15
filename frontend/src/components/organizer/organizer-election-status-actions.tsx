"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/types";
import type { Election } from "@/lib/api/types";
import { updateElectionStatus } from "@/lib/api/elections";

export function OrganizerElectionStatusActions({ election }: { election: Election }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isResubmission = election.status === "rejected";
  const canSubmit = election.status === "draft" || isResubmission;
  const mutation = useMutation({
    mutationFn: () => updateElectionStatus(election.id, { status: "pending_review" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-elections"] });
      queryClient.invalidateQueries({ queryKey: ["organizer-election", election.id] });
      toast.success(isResubmission ? "Election resubmitted" : "Election submitted", { description: "Your election is now waiting for admin review." });
      setOpen(false);
    },
    onError: (error) => toast.error("Couldn’t submit election", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });

  if (!canSubmit) return null;
  return <AlertDialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
    <AlertDialogTrigger asChild><Button type="button"><Send className="h-4 w-4" />{isResubmission ? "Resubmit for review" : "Submit for review"}</Button></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isResubmission ? "Resubmit" : "Submit"} “{election.title}”?</AlertDialogTitle><AlertDialogDescription>Admin reviewers will check the election before it can be approved and launched. You can make changes again if it is rejected.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" />Submit for review</>}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}