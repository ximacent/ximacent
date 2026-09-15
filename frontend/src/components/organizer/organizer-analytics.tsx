"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarClock, CircleDollarSign, Layers, RefreshCw, Trophy, UserRound, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { getOrganizerDashboard, type OrganizerDashboardData } from "@/lib/api/dashboard";
import { formatDate, formatMoney, mediaUrl } from "@/lib/utils";

const statusItems = [
  { key: "draft", label: "Draft", color: "bg-stone" },
  { key: "pending_review", label: "Review", color: "bg-champagne" },
  { key: "approved", label: "Approved", color: "bg-emerald-400" },
  { key: "rejected", label: "Changes", color: "bg-rose" },
  { key: "active", label: "Active", color: "bg-gold" },
  { key: "closed", label: "Closed", color: "bg-stone-soft" },
] as const;

function zeroFillSeries(items: Array<{ date: string; amount?: string; votes?: number }>, key: "amount" | "votes") {
  const values = new Map(items.map((item) => [
    item.date.slice(0, 10),
    key === "amount" ? moneyToCents(item.amount ?? "0.00") : item.votes ?? 0,
  ]));
  const result: Array<{ date: string; value: number }> = [];
  const today = new Date();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);
    const isoDate = date.toISOString().slice(0, 10);
    result.push({ date: isoDate, value: values.get(isoDate) ?? 0 });
  }

  return result;
}

function moneyToCents(amount: string): number {
  const [whole = "0", fraction = "0"] = amount.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

function centsLabel(cents: number): string {
  return `GHS ${(cents / 100).toFixed(2)}`;
}

function AnalyticsSkeleton() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-lg" />)}</div><div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><Skeleton className="h-80 rounded-lg" /><Skeleton className="h-80 rounded-lg" /></div><Skeleton className="h-72 rounded-lg" /></div>;
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Vote }) {
  return <div className="surface-card relative overflow-hidden p-5"><div className="relative flex items-start justify-between gap-3"><div><p className="text-xs text-stone">{label}</p><p className="mt-3 font-display text-2xl text-cream">{value}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-md bg-champagne/10 text-champagne"><Icon className="h-4 w-4" /></span></div></div>;
}

function ActivityChart({ data }: { data: OrganizerDashboardData }) {
  const revenue = zeroFillSeries(data.revenue.period, "amount");
  const votes = zeroFillSeries(data.votingActivity, "votes");
  const maxRevenue = Math.max(...revenue.map((item) => item.value), 1);
  const maxVotes = Math.max(...votes.map((item) => item.value), 1);

  return <div className="surface-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">Last 30 days</p><h2 className="mt-1.5 font-display text-xl text-cream">Activity</h2></div><div className="flex gap-4 text-[11px] text-stone"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-champagne" />Revenue</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose" />Votes</span></div></div><div className="mt-7 grid grid-cols-2 gap-5"><ChartBars items={revenue} max={maxRevenue} color="bg-champagne/75" format={centsLabel} /><ChartBars items={votes} max={maxVotes} color="bg-rose/75" format={(value) => `${value} votes`} /></div></div>;
}

function ChartBars({ items, max, color, format }: { items: Array<{ date: string; value: number }>; max: number; color: string; format: (value: number) => string }) {
  return <div className="min-w-0"><div className="flex h-40 items-end gap-0.5 sm:gap-1">{items.map((item) => <div key={item.date} className="group relative flex min-w-0 flex-1 items-end justify-center h-full"><span className="pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded bg-card px-1.5 py-1 text-[10px] text-cream opacity-0 shadow-soft transition group-hover:opacity-100">{format(item.value)}</span><div className={`w-full rounded-t-sm ${color} transition hover:opacity-100`} style={{ height: `${item.value ? Math.max((item.value / max) * 100, 4) : 2}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-stone"><span>{new Date(items[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span><span>{new Date(items.at(-1)!.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div></div>;
}

export function OrganizerAnalytics() {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({ queryKey: ["organizer-dashboard"], queryFn: getOrganizerDashboard, staleTime: 60_000, refetchInterval: 60_000 });

  if (isLoading) return <section className="mt-8"><AnalyticsSkeleton /></section>;
  if (isError || !data) return <section className="surface-card mt-8"><ErrorState title="Analytics unavailable" description="We couldn’t load your organizer analytics." onRetry={() => refetch()} /></section>;

  const { overview } = data;
  const statusTotal = Object.values(overview.electionsByStatus).reduce((sum, value) => sum + value, 0);

  return <section className="mt-10"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne">Overview</p><h2 className="mt-2 font-display text-2xl text-cream">Your platform at a glance</h2><p className="mt-2 text-sm text-stone">A view of activity across your own elections.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh organizer analytics"><RefreshCw className={isFetching ? "animate-spin" : ""} /></Button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Total revenue" value={formatMoney(overview.totalRevenue)} icon={CircleDollarSign} /><Kpi label="Total votes" value={overview.totalVotes.toLocaleString("en-US")} icon={Vote} /><Kpi label="Elections" value={String(overview.totalElections)} icon={Trophy} /><Kpi label="Nominees" value={String(overview.totalNominees)} icon={UserRound} /></div><div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><ActivityChart data={data} /><section className="surface-card p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">Portfolio</p><h2 className="mt-1.5 font-display text-xl text-cream">Election status</h2>{statusTotal === 0 ? <EmptyState icon={Trophy} title="No elections yet" description="Your election status breakdown will appear here." /> : <div className="mt-6 space-y-3">{statusItems.map((item) => { const count = overview.electionsByStatus[item.key]; const width = `${Math.max((count / statusTotal) * 100, count ? 4 : 0)}%`; return <div key={item.key}><div className="mb-1.5 flex justify-between text-xs"><span className="text-stone">{item.label}</span><span className="font-medium text-cream">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${item.color}`} style={{ width }} /></div></div>; })}</div>}</section></div><section className="mt-6"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">Performance</p><h2 className="mt-1.5 font-display text-xl text-cream">Election breakdown</h2></div><span className="text-xs text-stone">{data.elections.length} elections</span></div>{data.elections.length === 0 ? <div className="surface-card"><EmptyState icon={Trophy} title="No elections to show" description="Create an election after your organizer account is approved." /></div> : <div className="grid gap-4 lg:grid-cols-2">{data.elections.map((election) => <Link key={election.id} href={`/organizer/dashboard/elections/${election.id}`} className="surface-card group p-5 transition hover:border-champagne/35 hover:shadow-glow"><div className="flex items-start justify-between gap-3"><AdminStatusBadge status={election.status} /><span className="text-stone transition group-hover:text-champagne">→</span></div><h3 className="mt-4 line-clamp-2 font-display text-lg text-cream">{election.title}</h3><div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/50 pt-4"><div><p className="text-[11px] text-stone">Votes</p><p className="mt-1 text-sm text-cream">{election.totalVotes.toLocaleString("en-US")}</p></div><div><p className="text-[11px] text-stone">Revenue</p><p className="mt-1 text-sm text-cream">{formatMoney(election.totalRevenue)}</p></div><div><p className="text-[11px] text-stone">Price per vote</p><p className="mt-1 text-sm text-cream">{formatMoney(election.pricePerVote)}</p></div><div><p className="text-[11px] text-stone">{election.daysRemaining === null ? "Dates" : "Days left"}</p><p className="mt-1 flex items-center gap-1 text-xs text-cream"><CalendarClock className="h-3.5 w-3.5 text-champagne" />{election.daysRemaining === null ? formatDate(election.endDate) : election.daysRemaining === 0 ? "Ends today" : String(election.daysRemaining)}</p></div></div></Link>)}</div>}</section><section className="mt-8"><div className="mb-5"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">Top performers</p><h2 className="mt-1.5 font-display text-xl text-cream">Leading nominees</h2></div>{data.topNominees.length === 0 ? <div className="surface-card"><EmptyState icon={UserRound} title="No nominee results yet" description="Nominee rankings will appear after votes are recorded." /></div> : <div className="surface-card divide-y divide-border/50">{data.topNominees.slice(0, 10).map((nominee, index) => { const image = mediaUrl(nominee.imageUrl); return <div key={nominee.id} className="flex items-center gap-3 p-4"><span className="w-5 text-center font-display text-lg text-champagne">{index + 1}</span><div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-secondary">{image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><UserRound className="h-4 w-4 text-stone" /></div>}</div><div className="min-w-0 flex-1"><p className="truncate font-medium text-cream">{nominee.name}</p><p className="truncate text-xs text-stone">{nominee.category.name} · {nominee.election.title}</p></div><div className="text-right"><p className="font-medium text-cream">{nominee.totalVotes.toLocaleString("en-US")}</p><p className="text-[11px] text-stone">votes</p></div></div>; })}</div>}</section><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="surface-card p-5"><Layers className="h-4 w-4 text-champagne" /><p className="mt-4 font-display text-2xl text-cream">{overview.totalCategories}</p><p className="text-xs text-stone">Total categories</p></div><div className="surface-card p-5"><BarChart3 className="h-4 w-4 text-champagne" /><p className="mt-4 font-display text-2xl text-cream">{formatMoney(data.revenue.total)}</p><p className="text-xs text-stone">Revenue in successful payments</p></div></div></section>;
}
