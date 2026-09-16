"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, type UserSummary } from "@/lib/api/types";
import { confirmEmailChange, requestEmailChange } from "@/lib/api/users";
import { ChangeVerifiedFieldDialog } from "./change-verified-field-dialog";
import { useAuth } from "./auth-provider";

export function ChangeEmailDialog({ trigger, open, onOpenChange, onSuccess }: { trigger?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; onSuccess?: (user: UserSummary) => void } = {}) {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const errorMessage = (error: unknown) => {
    if (!(error instanceof ApiError)) return "We could not complete the email change.";
    if (error.status === 429 || error.key === "rate_limited") return "Too many attempts. Please wait before trying again.";
    if (error.message.toLowerCase().includes("already in use")) return "That email is already in use by another account. Enter a different email.";
    if (error.key === "no_pending_email_change" || error.message.includes("No email change is currently pending")) return "There is no active email change. Request a new code first.";
    if (error.key === "invalid_otp" || error.message.toLowerCase().includes("invalid or expired code")) return "That code is invalid or expired. Request a new code and try again.";
    if (error.message.toLowerCase().includes("already your current email")) return "That is already your current email. Enter a different email.";
    return error.message;
  };
  return <ChangeVerifiedFieldDialog field="email" icon={<Mail className="h-5 w-5 text-champagne" />} label="email address" valueLabel="email address" inputType="email" inputMode="email" placeholder="you@example.com" currentValue={user?.email} trigger={trigger} open={open} onOpenChange={onOpenChange} onRequest={(newEmail) => requestEmailChange({ newEmail })} onConfirm={(otp) => confirmEmailChange({ otp })} getRequestError={errorMessage} getConfirmError={errorMessage} confirmNotice={(newEmail) => <div className="rounded-md border border-champagne/30 bg-champagne/5 p-3 text-sm leading-relaxed text-stone">After confirming, you&apos;ll need to sign in with <strong className="text-cream">{newEmail}</strong> instead of your current email.</div>} onSuccess={(updatedUser) => { setUser(updatedUser); queryClient.setQueryData(["current-user-profile", updatedUser.id], updatedUser); onSuccess?.(updatedUser); toast.success("Email address changed", { description: "Use your new email address the next time you sign in." }); }} />;
}
