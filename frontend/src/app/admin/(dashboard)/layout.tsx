"use client";

import { ProtectedRoute } from "@/components/admin/protected-route";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-ink">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminMobileNav />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
