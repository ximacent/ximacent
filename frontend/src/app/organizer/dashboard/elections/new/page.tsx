"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ElectionForm } from "@/components/admin/elections/election-form";
import { ErrorState } from "@/components/admin/error-state";
import { getMyOrganizerStatus } from "@/lib/api/organizers";
import { createElection } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import { fromDateTimeLocalValue } from "@/lib/utils";
import type { ElectionFormValues } from "@/lib/validation/election";

export default function OrganizerNewElectionPage() {
  const router = useRouter();
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000 });
  const mutation = useMutation({
    mutationFn: (values: ElectionFormValues) => createElection({ title: values.title, description: values.description?.trim() || undefined, startDate: fromDateTimeLocalValue(values.startDate), endDate: fromDateTimeLocalValue(values.endDate), pricePerVote: values.pricePerVote }),
    onSuccess: (election) => { toast.success("Election created", { description: "It is saved as a draft. Add categories and nominees before submitting it." }); router.push(`/organizer/dashboard/elections/${election.id}`); },
    onError: (error) => toast.error("Couldn’t create election", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." }),
  });

  if (statusQuery.isLoading) return <div className="p-6 md:p-10"><div className="surface-card h-32 animate-pulse" /></div>;
  if (statusQuery.isError) return <div className="p-6 md:p-10"><ErrorState title="Organizer status unavailable" description="We couldn’t confirm whether your account can create elections." onRetry={() => statusQuery.refetch()} /></div>;
  if (!statusQuery.data?.canCreateElection) return <div className="p-6 md:p-10"><div className="surface-card max-w-2xl p-6 md:p-8"><h1 className="font-display text-display-md text-cream">Election creation is locked</h1><p className="mt-3 text-sm leading-relaxed text-stone">Your organizer account must be approved and fully verified before you can create an election. Open Profile & verification to see what remains.</p><ButtonLink href="/organizer/dashboard/profile" label="Open profile & verification" /></div></div>;

  return <div className="p-6 md:p-10"><Link href="/organizer/dashboard/elections" className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm text-stone hover:text-cream"><ArrowLeft className="h-3.5 w-3.5" />Back to elections</Link><h1 className="mt-4 font-display text-display-md text-cream">Create a new election</h1><p className="mt-2 max-w-xl text-stone">Every new election starts as a draft. Add categories and nominees before submitting it for review.</p><div className="surface-card mt-8 max-w-2xl p-6 md:p-8"><ElectionForm mode="create" isSubmitting={mutation.isPending} onSubmit={(values) => mutation.mutate(values)} onCancel={() => router.push("/organizer/dashboard/elections")} /></div></div>;
}

function ButtonLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-6 inline-flex items-center rounded-md bg-champagne px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-champagne-soft">{label}</Link>; }