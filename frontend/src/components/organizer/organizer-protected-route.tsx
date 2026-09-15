"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/admin/auth-provider";

export function OrganizerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace(`/organizer?redirectTo=${encodeURIComponent(pathname)}`);
    } else if (user.role !== "organizer") {
      router.replace(user.role === "admin" || user.role === "super_admin" ? "/admin" : "/");
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-champagne" /></div>;
  }

  if (!isAuthenticated || !user || user.role !== "organizer") return null;
  return <>{children}</>;
}