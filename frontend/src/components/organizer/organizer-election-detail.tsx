"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ElectionCategoriesPanel } from "@/components/admin/elections/election-categories-panel";
import { ElectionForm } from "@/components/admin/elections/election-form";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ErrorState } from "@/components/admin/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getElection, updateElection } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import { formatDateTime, fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/utils";
import { OrganizerElectionStatusActions } from "./organizer-election-status-actions";
import type { ElectionFormValues } from "@/lib/validation/election";

export function OrganizerElectionDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const query = useQuery({ queryKey: ["organizer-election", id], queryFn: () => getElection(id) });
  const mutation = useMutation({
    mutationFn: (values: ElectionFormValues) => updateElection(id, { title: values.title, description: values.description?.trim() || undefined, startDate: fromDateTimeLocalValue(values.startDate), endDate: fromDateTimeLocalValue(values.endDate), ...(query.data?.status === "draft" ? { pricePerVote: values.pricePerVote } : {}) }),
    onSuccess: (election) => { queryClient.setQueryData(["organizer-election", id], election); queryClient.invalidateQueries({ queryKey: ["organizer-elections"] }); setEditing(false); toast.success("Election updated"); },
    onError: (error) => toast.error("Couldn’t save election", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });

  if (query.isLoading) return <div className="p-6 md:p-10"><Skeleton className="h-8 w-64" /><Skeleton className="mt-8 h-96 max-w-4xl" /></div>;
  if (query.isError || !query.data) return <div className="p-6 md:p-10"><ErrorState title="Election unavailable" description="We couldn’t load this election. It may not belong to your organizer account." onRetry={() => query.refetch()} /></div>;
  const election = query.data;
  const editable = election.status === "draft" || election.status === "rejected";

  return <div className="p-6 md:p-10"><Link href="/organizer/dashboard/elections" className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm text-stone hover:text-cream"><ArrowLeft className="h-3.5 w-3.5" />My elections</Link><div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="font-display text-display-md text-cream">{election.title}</h1><AdminStatusBadge status={election.status} /></div>{election.rejectionReason && <div className="mt-5 rounded-md border border-rose/30 bg-rose/5 p-4 text-sm text-rose-soft"><p className="font-medium">Reviewer feedback</p><p className="mt-1 leading-relaxed">{election.rejectionReason}</p></div>}<div className="mt-6 flex flex-wrap gap-2"><OrganizerElectionStatusActions election={election} />{editable && <Button type="button" variant="outline" onClick={() => setEditing((value) => !value)}><Pencil className="h-3.5 w-3.5" />{editing ? "Close editor" : "Edit election"}</Button>}<Button variant="outline" asChild><a href={`/elections/${election.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" />View public page</a></Button></div>{editing && <div className="surface-card mt-6 max-w-2xl p-6 md:p-8"><ElectionForm mode="edit" status={election.status} defaultValues={{ title: election.title, description: election.description ?? "", startDate: toDateTimeLocalValue(election.startDate), endDate: toDateTimeLocalValue(election.endDate), pricePerVote: election.pricePerVote }} isSubmitting={mutation.isPending} onSubmit={(values) => mutation.mutate(values)} onCancel={() => setEditing(false)} /></div>}<div className="mt-8 max-w-4xl"><ElectionCategoriesPanel electionId={election.id} detailBasePath="/organizer/dashboard/categories" /></div><p className="mt-5 text-xs text-stone">Created {formatDateTime(election.createdAt)} · Last updated {formatDateTime(election.updatedAt)}</p></div>;
}