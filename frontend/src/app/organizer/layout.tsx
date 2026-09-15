import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/auth-provider";

export const metadata: Metadata = {
  title: "Organizer portal",
  robots: { index: false, follow: false },
};

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
