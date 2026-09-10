import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/auth-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
