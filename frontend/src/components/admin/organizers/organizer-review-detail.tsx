"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileImage, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/admin/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { approveOrganizer, getOrganizer, rejectOrganizer, suspendOrganizer } from "@/lib/api/organizers-admin";
import { ApiError } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/components/admin/auth-provider";
import { OverrideStatusDialog } from "@/components/admin/override-status-dialog";

export function OrganizerReviewDetail({ id }: { id: string }) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin-organizer", id], queryFn: () => getOrganizer(id), staleTime: 30_000 });
  const mutation = useMutation({
    mutationFn: ({ action, rejectionReason }: { action: "approve" | "reject" | "suspend"; rejectionReason?: string }) => action === "approve" ? approveOrganizer(id) : action === "reject" ? rejectOrganizer(id, rejectionReason ?? "") : suspendOrganizer(id),
    onSuccess: (profile, variables) => { queryClient.setQueryData(["admin-organizer", id], profile); queryClient.invalidateQueries({ queryKey: ["admin-organizers"] }); setReason(""); toast.success(variables.action === "approve" ? "Organizer approved" : variables.action === "reject" ? "Organizer rejected" : "Organizer suspended"); },
    onError: (error) => toast.error("Review action failed", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });
  if (query.isLoading) return <div className="p-6 md:p-10"><Skeleton className="h-8 w-64" /><Skeleton className="mt-8 h-96 max-w-3xl" /></div>;
  if (query.isError || !query.data) return <div className="p-6 md:p-10"><ErrorState title="Organizer unavailable" description="We couldn’t load this organizer profile." onRetry={() => query.refetch()} /></div>;
  const profile = query.data;
  const applicant = profile.user;
  const image = mediaUrl(profile.ghCardImageUrl);
  return <div className="p-6 md:p-10"><Link href="/admin/organizers" className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm text-stone hover:text-cream"><ArrowLeft className="h-3.5 w-3.5" />Review queue</Link><div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="font-display text-display-md text-cream">{profile.organizationName || "Organizer profile"}</h1><AdminStatusBadge status={profile.verificationStatus === "pending" ? "pending_review" : profile.verificationStatus === "approved" ? "approved" : profile.verificationStatus === "rejected" ? "rejected" : "draft"} /></div><div className="mt-5 flex flex-wrap gap-2">{currentUser?.role === "super_admin" && <OverrideStatusDialog type="organizer" id={id} currentStatus={profile.verificationStatus} />}</div><div className="mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.8fr]"><section className="surface-card p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Applicant</p><dl className="mt-5 grid gap-4 sm:grid-cols-2">{[["Name", applicant ? `${applicant.firstName} ${applicant.lastName}` : "Not available"], ["Email", applicant?.email || "Not available"], ["Personal phone", applicant?.phone || "Not provided"], ["Organization type", profile.organizationType || "Not provided"], ["Region", profile.region || "Not provided"], ["City", profile.city || "Not provided"], ["Organization phone", profile.organizationPhone || "Not provided"], ["Ghana Card number", profile.ghCardNumber || "Not provided"], ["Website", profile.website || "Not provided"], ["Social media", profile.socialMediaUrl || "Not provided"]].map(([label, value]) => <div key={label}><dt className="text-xs text-stone">{label}</dt><dd className="mt-1 break-words text-sm text-cream">{value}</dd></div>)}</dl><div className="mt-6 border-t border-border/50 pt-5"><p className="text-xs text-stone">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-cream">{profile.description || "No description provided."}</p></div></section><section className="surface-card p-5 sm:p-6"><div className="flex items-center gap-2"><FileImage className="h-4 w-4 text-champagne" /><h2 className="font-display text-lg text-cream">Ghana Card image</h2></div>{image ? <div className="relative mt-5 aspect-video overflow-hidden rounded-md bg-secondary"><img src={image} alt="Ghana Card submitted by organizer" className="h-full w-full object-contain" loading="lazy" /></div> : <div className="mt-5 rounded-md border border-dashed border-border/70 p-8 text-center text-sm text-stone">No Ghana Card image submitted.</div>}<div className="mt-6 space-y-3">{profile.verificationStatus === "pending" && <><div className="flex flex-wrap gap-2"><Button disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "approve" })}><CheckCircle2 className="h-4 w-4" />Approve</Button><Button variant="outline" className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft" disabled={mutation.isPending || !reason.trim()} onClick={() => mutation.mutate({ action: "reject", rejectionReason: reason.trim() })}><XCircle className="h-4 w-4" />Reject</Button></div><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for rejection: explain what needs to change" /></>}{profile.verificationStatus === "approved" && <Button variant="outline" className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "suspend" })}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suspend organizer"}</Button>}</div></section></div></div>;
}
