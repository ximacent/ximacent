"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BarChart3, CalendarClock, CheckCircle2, CircleDollarSign, Clock3, Layers, RefreshCw, Trophy, UserRound, UsersRound, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { useAuth } from "@/components/admin/auth-provider";
import { getDashboard } from "@/lib/api/dashboard";
import { formatDate, formatDateTime, formatMoney, mediaUrl } from "@/lib/utils";
import type { DashboardData } from "@/lib/api/dashboard";

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">{eyebrow}</p><h2 className="mt-1.5 font-display text-xl text-cream">{title}</h2></div>
      {href && <Link href={href} className="focus-ring inline-flex items-center gap-1.5 text-xs font-medium text-stone transition hover:text-champagne">{linkLabel ?? "View all"}<ArrowRight className="h-3.5 w-3.5" /></Link>}
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="space-y-8 p-6 md:p-10"><div className="space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-10 w-72" /><Skeleton className="h-4 w-80" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-lg" />)}</div><div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Skeleton className="h-80 rounded-lg" /><Skeleton className="h-80 rounded-lg" /></div></div>;
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Trophy }) {
  return <div className="surface-card relative overflow-hidden p-5"><div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-champagne/10 blur-2xl" /><div className="relative flex items-start justify-between gap-3"><div><p className="text-xs text-stone">{label}</p><p className="mt-3 font-display text-3xl text-cream">{value}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-md bg-champagne/12 text-champagne"><Icon className="h-4 w-4" /></span></div></div>;
}

function RevenueChart({ data }: { data: DashboardData["revenue"]["period"] }) {
  if (data.length === 0) return <EmptyState icon={BarChart3} title="No revenue activity yet" description="Successful payment activity will appear here." />;
  const max = Math.max(...data.map((item) => Number(item.amount)), 1);
  return <div className="px-1 pb-1 pt-4"><div className="flex h-48 items-end gap-2 sm:gap-4" aria-label="Revenue by day chart">{data.map((item) => { const height = Math.max((Number(item.amount) / max) * 100, 5); return <div key={item.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-stone opacity-0 transition group-hover:opacity-100">{formatMoney(item.amount)}</span><div className="w-full max-w-12 rounded-t-md bg-champagne/75 transition hover:bg-champagne" style={{ height: `${height}%` }} title={`${formatDate(item.date)}: ${formatMoney(item.amount)}`} /><span className="max-w-full truncate text-[10px] text-stone">{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>; })}</div></div>;
}

function PaymentSummary({ revenue }: { revenue: DashboardData["revenue"] }) {
  const items = [{ label: "Successful", value: revenue.successfulPayments, icon: CheckCircle2, color: "text-emerald-400" }, { label: "Pending", value: revenue.pendingPayments, icon: Clock3, color: "text-champagne" }, { label: "Failed", value: revenue.failedPayments, icon: AlertTriangle, color: "text-rose-soft" }];
  return <div className="grid grid-cols-3 gap-2">{items.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-md border border-border/60 bg-secondary/35 p-3"><Icon className={`h-4 w-4 ${color}`} /><p className="mt-3 text-lg font-semibold text-cream">{value}</p><p className="text-[11px] text-stone">{label}</p></div>)}</div>;
}

function ActivityList({ data }: { data: DashboardData["votingActivity"] }) {
  if (data.length === 0) return <EmptyState icon={Vote} title="No voting activity yet" description="Vote totals will appear here once voters participate." />;
  const max = Math.max(...data.map((item) => item.votes), 1);
  return <div className="space-y-4">{data.slice(-7).map((item) => <div key={item.date}><div className="mb-1.5 flex justify-between text-xs"><span className="text-stone">{formatDate(item.date)}</span><span className="font-medium text-cream">{compact(item.votes)} votes</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-rose/80" style={{ width: `${Math.max((item.votes / max) * 100, 3)}%` }} /></div></div>)}</div>;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, isFetching, refetch } = useQuery({ queryKey: ["admin-dashboard"], queryFn: getDashboard, staleTime: 60_000, refetchOnWindowFocus: false });
  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <div className="p-6 md:p-10"><ErrorState title="Dashboard unavailable" description="We couldn't load the latest dashboard data. Check your connection and try again." onRetry={() => refetch()} /></div>;
  const { overview, revenue } = data;

  return <div className="p-6 md:p-10">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Control panel</p><h1 className="mt-2 font-display text-display-md text-cream">Welcome back{user ? `, ${user.firstName}` : ""}</h1><p className="mt-2 text-stone">A clear view of your voting platform&apos;s performance.</p></div><div className="flex items-center gap-2 text-xs text-stone"><span className={`h-1.5 w-1.5 rounded-full ${isFetching ? "bg-champagne" : "bg-emerald-400"}`} />{isFetching ? "Updating..." : "Live overview"}<Button type="button" variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh dashboard"><RefreshCw className="h-3.5 w-3.5" /></Button></div></motion.div>

    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Total revenue" value={formatMoney(overview.totalRevenue)} icon={CircleDollarSign} /><KpiCard label="Total votes" value={compact(overview.totalVotes)} icon={Vote} /><KpiCard label="Active elections" value={String(overview.activeElections)} icon={Trophy} /><KpiCard label="Total nominees" value={String(overview.totalNominees)} icon={UserRound} /></div>

    <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><section className="surface-card p-5 sm:p-6"><SectionHeading eyebrow="Revenue" title="Revenue performance" /><div className="mb-5 flex items-baseline gap-2"><span className="font-display text-2xl text-cream">{formatMoney(revenue.total)}</span><span className="text-xs text-stone">across successful payments</span></div><RevenueChart data={revenue.period} /><div className="mt-6"><PaymentSummary revenue={revenue} /></div></section><section className="surface-card p-5 sm:p-6"><SectionHeading eyebrow="Voting activity" title="Recent votes" /><ActivityList data={data.votingActivity} /></section></div>

    <div className="mt-10"><SectionHeading eyebrow="Live now" title="Active elections" href="/admin/elections" linkLabel="Manage elections" />{data.activeElections.length === 0 ? <div className="surface-card"><EmptyState icon={Trophy} title="No active elections" description="Activate an election to start receiving votes." /></div> : <div className="grid gap-4 lg:grid-cols-3">{data.activeElections.map((election) => <Link key={election.id} href={`/admin/elections/${election.id}/edit`} className="surface-card group p-5 transition hover:border-champagne/35"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Active</span><ArrowRight className="h-4 w-4 text-stone transition group-hover:translate-x-0.5 group-hover:text-champagne" /></div><h3 className="mt-5 line-clamp-2 font-display text-lg text-cream">{election.title}</h3><div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/50 pt-4"><div><p className="text-[11px] text-stone">Votes</p><p className="mt-1 font-medium text-cream">{compact(election.totalVotes)}</p></div><div><p className="text-[11px] text-stone">Revenue</p><p className="mt-1 font-medium text-cream">{formatMoney(election.totalRevenue)}</p></div></div><p className="mt-4 flex items-center gap-1.5 text-xs text-stone"><CalendarClock className="h-3.5 w-3.5" />Ends {formatDate(election.endDate)}</p></Link>)}</div>}</div>

    <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><section><SectionHeading eyebrow="Leaderboard" title="Top nominees" href="/admin/nominees" linkLabel="Manage nominees" />{data.topNominees.length === 0 ? <div className="surface-card"><EmptyState icon={UserRound} title="No nominee results yet" description="Nominee rankings will appear after votes are recorded." /></div> : <div className="surface-card divide-y divide-border/50">{data.topNominees.slice(0, 5).map((nominee, index) => { const image = mediaUrl(nominee.imageUrl); return <div key={nominee.id} className="flex items-center gap-3 p-4"><span className="w-5 text-center font-display text-lg text-champagne">{index + 1}</span><div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-secondary">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><UserRound className="h-4 w-4 text-stone" /></div>}</div><div className="min-w-0 flex-1"><p className="truncate font-medium text-cream">{nominee.name}</p><p className="truncate text-xs text-stone">{nominee.category.name} · {nominee.election.title}</p></div><div className="text-right"><p className="font-medium text-cream">{compact(nominee.totalVotes)}</p><p className="text-[11px] text-stone">votes</p></div></div>; })}</div>}</section><section><SectionHeading eyebrow="Coming up" title="Upcoming elections" />{data.upcomingElections.length === 0 ? <div className="surface-card"><EmptyState icon={CalendarClock} title="Nothing scheduled" description="Upcoming elections will appear here." /></div> : <div className="surface-card divide-y divide-border/50">{data.upcomingElections.map((election) => <Link key={election.id} href={`/admin/elections/${election.id}/edit`} className="flex items-center gap-3 p-4 transition hover:bg-secondary/30"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-champagne/10 text-champagne"><CalendarClock className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-cream">{election.title}</span><span className="mt-1 block text-xs text-stone">Starts {formatDateTime(election.startDate)}</span></span><ArrowRight className="h-4 w-4 text-stone" /></Link>)}</div>}</section></div>

    <div className="mt-10 grid gap-6 lg:grid-cols-2"><section><SectionHeading eyebrow="Attention" title="Needs attention" />{data.attentionItems.length === 0 ? <div className="surface-card"><EmptyState icon={CheckCircle2} title="All clear" description="There are no outstanding dashboard alerts." /></div> : <div className="surface-card divide-y divide-border/50">{data.attentionItems.map((item) => <div key={item.type === "stale_pending_payment" ? item.paymentId : item.electionId} className="flex items-start gap-3 p-4"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-champagne/10 text-champagne"><AlertTriangle className="h-4 w-4" /></span><div><p className="text-sm font-medium text-cream">{item.type === "stale_pending_payment" ? "Pending payment requires attention" : "Active election has no votes"}</p><p className="mt-1 text-xs text-stone">{item.type === "stale_pending_payment" ? `Reference ${item.reference} · Created ${formatDateTime(item.createdAt)}` : `${item.title} ends ${formatDate(item.endDate)}`}</p></div></div>)}</div>}</section><section><SectionHeading eyebrow="Platform" title="Inventory at a glance" /><div className="surface-card grid grid-cols-2 gap-px overflow-hidden bg-border/50"><div className="bg-card p-5"><Layers className="h-4 w-4 text-champagne" /><p className="mt-4 font-display text-2xl text-cream">{overview.totalCategories}</p><p className="text-xs text-stone">Categories</p></div><div className="bg-card p-5"><Trophy className="h-4 w-4 text-champagne" /><p className="mt-4 font-display text-2xl text-cream">{overview.totalElections}</p><p className="text-xs text-stone">Total elections</p></div><div className="bg-card p-5"><UsersRound className="h-4 w-4 text-champagne" /><p className="mt-4 font-display text-2xl text-cream">{compact(overview.totalVotes)}</p><p className="text-xs text-stone">Votes recorded</p></div><div className="bg-card p-5"><CircleDollarSign className="h-4 w-4 text-champagne" /><p className="mt-4 font-display text-2xl text-cream">{formatMoney(overview.totalRevenue)}</p><p className="text-xs text-stone">Revenue to date</p></div></div></section></div>
  </div>;
}
