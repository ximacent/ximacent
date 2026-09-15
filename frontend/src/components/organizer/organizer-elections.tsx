"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { listElections } from "@/lib/api/elections";
import { getMyOrganizerStatus } from "@/lib/api/organizers";
import { formatDate, formatMoney } from "@/lib/utils";
import { useAuth } from "@/components/admin/auth-provider";

export function OrganizerElections() {
  const { user } = useAuth();
  const electionsQuery = useQuery({
    queryKey: ["organizer-elections", user?.id],
    queryFn: () => listElections({ createdById: user!.id, limit: 100 }),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000 });
  const canCreate = statusQuery.data?.canCreateElection === true;

  if (electionsQuery.isLoading || statusQuery.isLoading) {
    return <section className="surface-card mt-8 space-y-4 p-5 sm:p-6"><Skeleton className="h-7 w-52" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></section>;
  }

  if (electionsQuery.isError || statusQuery.isError) {
    return <section className="surface-card mt-8"><ErrorState title="Elections unavailable" description="We couldn’t load your elections." onRetry={() => { electionsQuery.refetch(); statusQuery.refetch(); }} /></section>;
  }

  const elections = electionsQuery.data?.elections ?? [];

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne">Workspace</p><h1 className="mt-2 font-display text-display-md text-cream">My elections</h1><p className="mt-2 text-sm text-stone">Create and track elections owned by your organizer account.</p></div>{canCreate ? <Button asChild><Link href="/organizer/dashboard/elections/new"><Plus className="h-4 w-4" />New election</Link></Button> : <span className="text-xs text-stone">Available after organizer approval</span>}</div>
      {elections.length === 0 ? <div className="surface-card mt-5"><EmptyState icon={Trophy} title="No elections yet" description={canCreate ? "Create your first election to begin setting up categories and nominees." : "Your first election will be available once your organizer application is approved."} action={canCreate ? <Button asChild><Link href="/organizer/dashboard/elections/new"><Plus className="h-4 w-4" />Create election</Link></Button> : undefined} /></div> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{elections.map((election) => <Link key={election.id} href={`/organizer/dashboard/elections/${election.id}`} className="surface-card group block p-5 transition hover:border-champagne/35 hover:shadow-glow"><div className="flex items-start justify-between gap-3"><AdminStatusBadge status={election.status} /><ArrowRight className="h-4 w-4 text-stone transition group-hover:translate-x-0.5 group-hover:text-champagne" /></div><h3 className="mt-5 line-clamp-2 font-display text-xl text-cream">{election.title}</h3>{election.rejectionReason && <p className="mt-3 line-clamp-2 rounded-md border border-rose/30 bg-rose/5 p-3 text-xs text-rose-soft">Changes requested: {election.rejectionReason}</p>}<div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/50 pt-4"><div><p className="text-[11px] text-stone">Price per vote</p><p className="mt-1 text-sm text-cream">{formatMoney(election.pricePerVote)}</p></div><div><p className="text-[11px] text-stone">Voting dates</p><p className="mt-1 flex items-center gap-1 text-xs text-cream"><CalendarClock className="h-3.5 w-3.5 text-champagne" />{formatDate(election.startDate)} - {formatDate(election.endDate)}</p></div></div></Link>)}</div>}
    </section>
  );
}
