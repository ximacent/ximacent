"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`/admin/login?redirectTo=${redirectTo}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect effect above is already in flight — render nothing rather
    // than a flash of protected content.
    return null;
  }

  return <>{children}</>;
}
