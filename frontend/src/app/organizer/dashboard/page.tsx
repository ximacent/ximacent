"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardCheck, Layers, Plus, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/components/admin/auth-provider";
import { Button } from "@/components/ui/button";
import { OrganizerAnalytics } from "@/components/organizer/organizer-analytics";
import { ApplicationStatusOverview } from "@/components/organizer/application-status-overview";
import { getMyOrganizerStatus } from "@/lib/api/organizers";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const { data: status, isLoading } = useQuery({
    queryKey: ["organizer-status"],
    queryFn: getMyOrganizerStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <div className="dashboard-page p-6 md:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Organizer workspace</p><h1 className="mt-2 font-display text-display-md text-cream">Welcome{user ? `, ${user.firstName}` : ""}</h1><p className="mt-2 text-stone">Manage your elections and track activity from one place.</p></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href="/"><ArrowRight className="h-3.5 w-3.5" />Public site</Link></Button>{status?.canCreateElection && <Button asChild size="sm"><Link href="/organizer/dashboard/elections/new"><Plus className="h-4 w-4" />New election</Link></Button>}</div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink href="/organizer/dashboard/elections" icon={Trophy} label="My elections" description="Create, edit, and submit elections." />
        <QuickLink href="/organizer/dashboard/categories" icon={Layers} label="Categories" description="Organize categories across your elections." />
        <QuickLink href="/organizer/dashboard/nominees" icon={UserRound} label="Nominees" description="Manage the people voters can choose." />
        <QuickLink href="/organizer/dashboard/profile" icon={ClipboardCheck} label="Profile & verification" description={isLoading ? "Loading application status..." : status?.canCreateElection ? "Your organizer access is approved." : "Complete your application and verification."} />
      </section>

      <ApplicationStatusOverview status={status} isLoading={isLoading} />

      <OrganizerAnalytics />
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, description }: { href: string; icon: typeof Trophy; label: string; description: string }) {
  return <Link href={href} className="surface-card group p-5 transition hover:border-champagne/35 hover:shadow-glow"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-champagne/10 text-champagne"><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-stone transition group-hover:translate-x-0.5 group-hover:text-champagne" /></div><h2 className="mt-5 font-display text-lg text-cream">{label}</h2><p className="mt-1 text-xs leading-relaxed text-stone">{description}</p></Link>;
}
