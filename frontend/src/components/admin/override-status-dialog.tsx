"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/types";
import { overrideElectionStatus } from "@/lib/api/elections";
import { overrideOrganizerStatus } from "@/lib/api/organizers-admin";
import type { OrganizerVerificationStatus } from "@/lib/api/organizers";
import type { OrganizerProfile } from "@/lib/api/organizers";
import type { ElectionStatus } from "@/lib/api/types";
import type { Election } from "@/lib/api/types";

const electionStatuses: ElectionStatus[] = ["draft", "pending_review", "approved", "rejected", "active", "closed"];
const organizerStatuses: OrganizerVerificationStatus[] = ["not_started", "pending", "approved", "rejected", "suspended"];

export function OverrideStatusDialog({ type, id, currentStatus }: { type: "election" | "organizer"; id: string; currentStatus: ElectionStatus | OrganizerVerificationStatus }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const statuses = type === "election" ? electionStatuses : organizerStatuses;
  const mutation = useMutation<Election | OrganizerProfile, unknown, void>({
    mutationFn: () => type === "election" ? overrideElectionStatus(id, status as ElectionStatus, reason.trim()) : overrideOrganizerStatus(id, status as OrganizerVerificationStatus, reason.trim()),
    onSuccess: (updated) => { queryClient.setQueryData([type === "election" ? "admin-election" : "admin-organizer", id], updated); queryClient.invalidateQueries({ queryKey: [type === "election" ? "admin-elections" : "admin-organizers"] }); toast.success("Status overridden"); setOpen(false); setReason(""); },
    onError: (error) => toast.error("Couldn’t override status", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });
  return <><Button type="button" variant="outline" className="border-rose/40 text-rose-soft hover:bg-rose/10" onClick={() => setOpen(true)}><Wrench className="h-4 w-4" />Override status</Button><Dialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-soft" />Override status</DialogTitle><DialogDescription>This bypasses the normal {type} workflow. Use it only to correct a reviewed mistake. A reason is required and will be audited.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor={`${type}-override-status`}>New status</Label><Select value={status} onValueChange={(value) => setStatus(value as typeof status)} disabled={mutation.isPending}><SelectTrigger id={`${type}-override-status`}><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor={`${type}-override-reason`}>Reason</Label><Textarea id={`${type}-override-reason`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this override is necessary" disabled={mutation.isPending} /></div><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancel</Button><Button type="button" variant="destructive" disabled={mutation.isPending || !reason.trim() || status === currentStatus} onClick={() => mutation.mutate()}>{mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Applying…</> : "Apply override"}</Button></div></div></DialogContent></Dialog></>;
}
