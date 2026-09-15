"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || !["admin", "super_admin"].includes(user.role))) {
      const redirectTo = encodeURIComponent(pathname);
      router.replace(
        !isAuthenticated || !user
          ? `/admin/login?redirectTo=${redirectTo}`
          : user.role === "organizer"
            ? "/organizer/dashboard"
            : "/"
      );
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !["admin", "super_admin"].includes(user.role)) {
    // Redirect effect above is already in flight — render nothing rather
    // than a flash of protected content.
    return null;
  }

  return <>{children}</>;
}
