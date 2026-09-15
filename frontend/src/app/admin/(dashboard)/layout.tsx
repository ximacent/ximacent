"use client";

import { ProtectedRoute } from "@/components/admin/protected-route";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-ink">
        <div className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-0 h-screen">
            <AdminSidebar />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminMobileNav />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
