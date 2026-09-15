"use client";

import { OrganizerMobileNav } from "@/components/organizer/organizer-mobile-nav";
import { OrganizerProtectedRoute } from "@/components/organizer/organizer-protected-route";
import { OrganizerSidebar } from "@/components/organizer/organizer-sidebar";

export default function OrganizerDashboardLayout({ children }: { children: React.ReactNode }) {
  return <OrganizerProtectedRoute>
    <div className="flex h-screen overflow-hidden bg-ink">
      <div className="hidden w-64 shrink-0 md:block"><div className="sticky top-0 h-screen"><OrganizerSidebar /></div></div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden"><OrganizerMobileNav /><main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main></div>
    </div>
  </OrganizerProtectedRoute>;
}