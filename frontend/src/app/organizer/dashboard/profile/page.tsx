"use client";

import { ProfileApplication } from "@/components/organizer/profile-application";
import { VerificationPanel } from "@/components/organizer/verification-panel";

export default function OrganizerProfilePage() {
  return <div className="p-6 md:p-10"><div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Organizer workspace</p><h1 className="mt-2 font-display text-display-md text-cream">Profile & verification</h1><p className="mt-2 max-w-2xl text-stone">Verify your account, complete your organizer profile, and track the application review.</p></div><VerificationPanel /><ProfileApplication /></div>;
}