"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Mail, Phone, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { getUser, resendEmailVerification, requestPhoneVerification, verifyEmail, verifyPhone } from "@/lib/api/users";
import { getMyOrganizerStatus } from "@/lib/api/organizers";
import { useAuth } from "@/components/admin/auth-provider";

const COOLDOWN_SECONDS = 30;

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

function useCooldown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(current - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  return { seconds, start: () => setSeconds(COOLDOWN_SECONDS) };
}

function OtpInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      pattern="[0-9]{6}"
      placeholder="000000"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      className="text-center font-mono tracking-[0.35em]"
    />
  );
}

export function VerificationPanel() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000, refetchInterval: 60_000 });
  const accountUserQuery = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpRequested, setPhoneOtpRequested] = useState(false);
  const emailCooldown = useCooldown();
  const phoneCooldown = useCooldown();

  const verifyEmailMutation = useMutation({
    mutationFn: () => verifyEmail({ email: user!.email, otp: emailOtp }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["organizer-status"] });
      setEmailOtp("");
      toast.success("Email verified", { description: "Your email address is now confirmed." });
    },
    onError: (error) => toast.error("Email verification failed", { description: errorMessage(error) }),
  });

  const resendEmailMutation = useMutation({
    mutationFn: () => resendEmailVerification(user!.email),
    onSuccess: () => {
      emailCooldown.start();
      toast.success("Verification code sent", { description: "Check your email for the latest code." });
    },
    onError: (error) => toast.error("Couldn’t send code", { description: errorMessage(error) }),
  });

  const requestPhoneMutation = useMutation({
    mutationFn: requestPhoneVerification,
    onSuccess: () => {
      setPhoneOtpRequested(true);
      queryClient.invalidateQueries({ queryKey: ["organizer-status"] });
      phoneCooldown.start();
      toast.success("Verification code sent", { description: "Check your phone for the latest code." });
    },
    onError: (error) => toast.error("Couldn’t send code", { description: errorMessage(error) }),
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: () => verifyPhone({ otp: phoneOtp }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(["current-user-profile", user?.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["organizer-status"] });
      setPhoneOtp("");
      setPhoneOtpRequested(false);
      toast.success("Phone verified", { description: "Your phone number is now confirmed." });
    },
    onError: (error) => toast.error("Phone verification failed", { description: errorMessage(error) }),
  });

  const emailVerified = statusQuery.data?.emailVerified ?? user?.emailVerified ?? false;
  // /organizers/me/status currently omits phoneVerified. The User record is
  // authoritative for this flag; do not fall back to stale localStorage data
  // while the fresh account request is still loading.
  const phoneVerified = accountUserQuery.data?.phoneVerified === true;

  // Keep the panel visible so verified state is explicit and an organizer
  // never loses the recovery path because cached auth flags are stale.
  if (!user) return null;

  const accountUser = accountUserQuery.data ?? user;
  const accountPhone = accountUser.phone;

  const emailBusy = verifyEmailMutation.isPending || resendEmailMutation.isPending;
  const phoneBusy = verifyPhoneMutation.isPending || requestPhoneMutation.isPending;

  return (
    <section id="phone-verification" className="surface-card mt-8 scroll-mt-6 overflow-hidden">
      <div className="border-b border-border/60 bg-champagne/5 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-champagne/15 text-champagne">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl text-cream">Verify your account</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone">
              Complete both checks before submitting your organizer application. You can do them in either order.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border/50 md:grid-cols-2">
        <div className="bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cream"><Mail className="h-4 w-4 text-champagne" /><h3 className="font-medium">Email address</h3></div>
            {emailVerified && <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-label="Email verified" />}
          </div>
          <p className="mt-2 truncate text-xs text-stone">{user.email}</p>
          {emailVerified ? (
            <p className="mt-5 text-sm text-emerald-300">Your email is verified.</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="space-y-2"><Label htmlFor="email-otp">Email code</Label><OtpInput id="email-otp" value={emailOtp} onChange={setEmailOtp} disabled={emailBusy} /></div>
              <Button type="button" className="w-full" disabled={emailBusy || emailOtp.length !== 6} onClick={() => verifyEmailMutation.mutate()}>{verifyEmailMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : <><CheckCircle2 className="h-4 w-4" />Verify email</>}</Button>
              <Button type="button" variant="ghost" className="w-full text-xs" disabled={emailBusy || emailCooldown.seconds > 0} onClick={() => resendEmailMutation.mutate()}>{resendEmailMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : emailCooldown.seconds > 0 ? <><RefreshCw className="h-3.5 w-3.5" />Resend in {emailCooldown.seconds}s</> : <><Send className="h-3.5 w-3.5" />Resend code</>}</Button>
            </div>
          )}
        </div>

        <div className="bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cream"><Phone className="h-4 w-4 text-champagne" /><h3 className="font-medium">Phone number</h3></div>
            {phoneVerified && <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-label="Phone verified" />}
          </div>
          <p className="mt-2 text-xs text-stone">{accountPhone ? `Account phone: ${accountPhone}` : "Add an account phone number in My Profile first. This verifies your account phone, not the organization phone."}</p>
          {phoneVerified ? (
            <p className="mt-5 text-sm text-emerald-300">Your phone is verified.</p>
          ) : (
            <div className="mt-5 space-y-4">
              <Button type="button" variant="outline" className="w-full" disabled={phoneBusy || accountUserQuery.isLoading || phoneCooldown.seconds > 0 || !accountPhone} onClick={() => requestPhoneMutation.mutate()}>{requestPhoneMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : accountUserQuery.isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Loading account phone…</> : phoneCooldown.seconds > 0 ? <><RefreshCw className="h-4 w-4" />Request again in {phoneCooldown.seconds}s</> : <><Send className="h-4 w-4" />Verify phone number</>}</Button>
              {phoneOtpRequested && <>
                <p className="text-sm text-stone">Enter the OTP sent to your phone number.</p>
                <div className="space-y-2"><Label htmlFor="phone-otp">Phone code</Label><OtpInput id="phone-otp" value={phoneOtp} onChange={setPhoneOtp} disabled={phoneBusy || !accountPhone} /></div>
                <Button type="button" className="w-full" disabled={phoneBusy || phoneOtp.length !== 6 || !accountPhone} onClick={() => verifyPhoneMutation.mutate()}>{verifyPhoneMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : <><CheckCircle2 className="h-4 w-4" />Verify phone</>}</Button>
              </>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
