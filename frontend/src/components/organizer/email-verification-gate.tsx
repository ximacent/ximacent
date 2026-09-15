"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { resendEmailVerification, verifyEmail } from "@/lib/api/users";
import { useAuth } from "@/components/admin/auth-provider";

export function EmailVerificationGate() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-stone">
        Loading your verification request...
      </div>
    );
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setIsVerifying(true);
    try {
      const verifiedUser = await verifyEmail({ email: user.email, otp });
      setUser(verifiedUser);
      toast.success("Email verified", { description: "Your organizer workspace is ready." });
      router.replace("/organizer/dashboard");
    } catch (error) {
      toast.error("Verification failed", { description: error instanceof ApiError ? error.message : "Enter the latest six-digit code and try again." });
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!user) return;
    setIsResending(true);
    try {
      await resendEmailVerification(user.email);
      toast.success("Verification code sent", { description: "Check your inbox for the latest code." });
    } catch (error) {
      toast.error("Couldn’t resend code", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mx-auto block w-fit rounded-md focus:outline-none focus:ring-2 focus:ring-champagne">
          <Image src="/logo.png" alt="Ximacent" width={160} height={32} priority />
        </Link>
        <section className="surface-card mt-8 p-6 shadow-elevated sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-champagne/15 text-champagne"><Mail className="h-5 w-5" /></div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-champagne">One quick step</p>
          <h1 className="mt-2 font-display text-display-sm text-cream">Verify your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone">We sent a six-digit verification code to <span className="text-cream">{user.email}</span>. Verify it before entering your organizer workspace.</p>

          <form onSubmit={handleVerify} className="mt-7 space-y-4" noValidate>
            <div className="space-y-2"><Label htmlFor="organizer-email-otp">Email verification code</Label><Input id="organizer-email-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={otp} disabled={isVerifying} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center font-mono tracking-[0.35em]" /></div>
            <Button type="submit" className="w-full" disabled={isVerifying || otp.length !== 6}>{isVerifying ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : <><CheckCircle2 className="h-4 w-4" />Verify email</>}</Button>
          </form>

          <Button type="button" variant="ghost" className="mt-3 w-full text-xs" disabled={isVerifying || isResending} onClick={handleResend}>{isResending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending...</> : <><RefreshCw className="h-3.5 w-3.5" />Resend verification code</>}</Button>
          <Link href="/organizer/dashboard" className="mt-5 block text-center text-xs text-stone underline-offset-4 hover:text-cream hover:underline">Continue to dashboard</Link>
        </section>
      </div>
    </main>
  );
}
