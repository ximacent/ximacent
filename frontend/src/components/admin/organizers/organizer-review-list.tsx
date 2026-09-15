"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Loader2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { approveOrganizer, listOrganizers, rejectOrganizer } from "@/lib/api/organizers-admin";
import { ApiError } from "@/lib/api/types";

export function OrganizerReviewList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin-organizers", { search }], queryFn: () => listOrganizers({ verificationStatus: "pending", search: search || undefined, limit: 50 }), staleTime: 30_000 });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject"; }) => action === "approve" ? approveOrganizer(id) : rejectOrganizer(id, reason.trim()),
    onSuccess: (_profile, variables) => { queryClient.invalidateQueries({ queryKey: ["admin-organizers"] }); toast.success(variables.action === "approve" ? "Organizer approved" : "Organizer rejected"); setRejectingId(null); setReason(""); },
    onError: (error) => toast.error("Review action failed", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });

  const organizers = query.data?.organizers ?? [];
  return <div className="p-6 md:p-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Review queue</p><h1 className="mt-2 font-display text-display-md text-cream">Organizer applications</h1><p className="mt-2 text-stone">Review submitted organizer profiles and identity documents.</p></div><span className="text-sm text-stone">{query.data?.pagination.total ?? 0} pending</span></div><div className="surface-card mt-8 overflow-hidden"><div className="border-b border-border/50 p-4"><div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or organization" /></div></div>{query.isLoading ? <div className="space-y-3 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : query.isError ? <ErrorState title="Review queue unavailable" description="We couldn’t load organizer applications." onRetry={() => query.refetch()} /> : organizers.length === 0 ? <EmptyState icon={ClipboardCheck} title="Queue is clear" description="There are no organizer applications waiting for review." /> : <div className="divide-y divide-border/50">{organizers.map((organizer) => { const applicant = organizer.user; const isRejecting = rejectingId === organizer.id; return <div key={organizer.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg text-cream">{organizer.organizationName || "Unnamed organization"}</h2><AdminStatusBadge status={organizer.verificationStatus === "pending" ? "pending_review" : "draft"} /></div><p className="mt-1 text-sm text-stone">{applicant ? `${applicant.firstName} ${applicant.lastName} · ${applicant.email}` : "Applicant details unavailable"}</p><p className="mt-1 text-xs text-stone">{organizer.city || "City not provided"}{organizer.region ? `, ${organizer.region}` : ""}</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href={`/admin/organizers/${organizer.id}`}>Review details</Link></Button><Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: organizer.id, action: "approve" })}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button><Button variant="outline" size="sm" className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft" disabled={mutation.isPending} onClick={() => setRejectingId(isRejecting ? null : organizer.id)}><XCircle className="h-3.5 w-3.5" />Reject</Button></div></div>{isRejecting && <div className="mt-4 max-w-xl space-y-3 rounded-md border border-rose/30 bg-rose/5 p-4"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required: explain what needs to change" /><Button variant="destructive" size="sm" disabled={mutation.isPending || !reason.trim()} onClick={() => mutation.mutate({ id: organizer.id, action: "reject" })}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit rejection"}</Button></div>}</div>; })}</div>}</div></div>;
}
