"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyOrganizerProfile } from "@/lib/api/organizers";
import type { OrganizerStatusSummary } from "@/lib/api/organizers";
import { getUser } from "@/lib/api/users";
import { useAuth } from "@/components/admin/auth-provider";

export function ApplicationStatusOverview({ status, isLoading }: { status?: OrganizerStatusSummary; isLoading: boolean }) {
  const { user } = useAuth();
  const accountUserQuery = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const profileQuery = useQuery({
    queryKey: ["organizer-profile"],
    queryFn: getMyOrganizerProfile,
    enabled: Boolean(status && ["not_started", "rejected"].includes(status.verificationStatus)),
    staleTime: 60_000,
  });

  if (isLoading || !status) {
    return <div className="surface-card mt-8 h-32 animate-pulse" aria-label="Loading application status" />;
  }

  const profile = profileQuery.data;
  const phoneVerified = accountUserQuery.data?.phoneVerified === true;
  const requirements = [
    { label: "Email verified", complete: status.emailVerified },
    { label: "Account phone verified", complete: phoneVerified, href: "/organizer/dashboard/profile#phone-verification", action: "Verify phone" },
    { label: "Organization details", complete: Boolean(profile?.organizationName && profile.organizationType && profile.region && profile.city && profile.organizationPhone), href: "/organizer/dashboard/profile#organizer-profile", action: "Complete" },
    { label: "Ghana Card information", complete: Boolean(profile?.ghCardNumber && profile.ghCardImageUrl), href: "/organizer/dashboard/profile#organizer-profile", action: "Complete" },
  ];

  const copy = {
    not_started: { title: "Complete your organizer application", description: "Complete your profile, verify your email and account phone, then submit your application for admin approval.", icon: ClipboardCheck, tone: "border-champagne/30 bg-champagne/5" },
    pending: { title: "Application under review", description: "Your organizer application has been submitted and is awaiting admin review. You do not need to submit it again.", icon: Clock3, tone: "border-champagne/30 bg-champagne/5" },
    approved: { title: "Organizer account approved", description: "Your organizer capabilities are unlocked. You can create elections and manage their categories and nominees.", icon: CheckCircle2, tone: "border-emerald-400/30 bg-emerald-400/5" },
    rejected: { title: "Application needs changes", description: status.rejectionReason || "Review the feedback, update your application, and submit it again for approval.", icon: AlertTriangle, tone: "border-rose/30 bg-rose/5" },
    suspended: { title: "Organizer access suspended", description: "Your organizer election privileges are currently paused. Profile changes and election management are unavailable.", icon: LockKeyhole, tone: "border-rose/30 bg-rose/5" },
  }[status.verificationStatus];
  const Icon = copy.icon;
  const showRequirements = status.verificationStatus === "not_started" || status.verificationStatus === "rejected";

  return <section className={`surface-card mt-8 border p-5 sm:p-6 ${copy.tone}`} aria-live="polite">
    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-champagne/15 text-champagne"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne">Application status</p><h2 className="mt-2 font-display text-xl text-cream">{copy.title}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone">{copy.description}</p></div></div>
    {showRequirements && <div className="mt-5 border-t border-border/50 pt-4"><p className="text-sm font-medium text-cream">Complete these items before submitting:</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{requirements.map((item) => { const RequirementIcon = item.complete ? CheckCircle2 : item.label === "Account phone verified" ? Smartphone : ShieldCheck; return <div key={item.label} className="flex items-center gap-2 text-sm"><RequirementIcon className={`h-4 w-4 ${item.complete ? "text-emerald-400" : "text-rose-soft"}`} /><span className={item.complete ? "text-stone" : "text-cream"}>{item.label}</span>{!item.complete && item.href && <Link href={item.href} className="ml-auto text-xs font-medium text-champagne hover:text-champagne-soft">{item.action}</Link>}</div>; })}</div></div>}
    {status.verificationStatus === "pending" ? null : status.verificationStatus === "approved" ? <Button asChild className="mt-5"><Link href="/organizer/dashboard/elections">Manage elections</Link></Button> : status.verificationStatus === "suspended" ? null : <Button asChild className="mt-5"><Link href="/organizer/dashboard/profile#organizer-profile">{status.verificationStatus === "rejected" ? "Review & resubmit" : "Complete profile"}</Link></Button>}
  </section>;
}
