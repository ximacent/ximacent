import type { Metadata } from "next";
import { EmailVerificationGate } from "@/components/organizer/email-verification-gate";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default function OrganizerEmailVerificationPage() {
  return <EmailVerificationGate />;
}
