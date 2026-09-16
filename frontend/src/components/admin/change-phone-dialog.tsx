"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ApiError, type UserSummary } from "@/lib/api/types";
import { confirmPhoneChange, requestPhoneChange } from "@/lib/api/users";
import { ChangeVerifiedFieldDialog } from "./change-verified-field-dialog";
import { useAuth } from "./auth-provider";

export function ChangePhoneDialog({ trigger, open, onOpenChange, onSuccess }: { trigger?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; onSuccess?: (user: UserSummary) => void } = {}) {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const errorMessage = (error: unknown) => {
    if (!(error instanceof ApiError)) return "We could not complete the phone number change.";
    if (error.status === 429 || error.key === "rate_limited") return "Too many attempts. Please wait before trying again.";
    if (error.key === "no_pending_phone_change" || error.message.includes("No phone change is currently pending")) return "There is no active phone change. Request a new code first.";
    if (error.key === "invalid_otp" || error.message.toLowerCase().includes("invalid or expired code")) return "That code is invalid or expired. Request a new code and try again.";
    if (error.message.toLowerCase().includes("already your current phone number")) return "That is already your current phone number. Enter a different number.";
    return error.message;
  };
  return <ChangeVerifiedFieldDialog field="phone" icon={<Phone className="h-5 w-5 text-champagne" />} label="phone number" valueLabel="number" inputType="tel" inputMode="tel" placeholder="024 709 8016" currentValue={user?.phone} trigger={trigger} open={open} onOpenChange={onOpenChange} onRequest={(newPhone) => requestPhoneChange({ newPhone })} onConfirm={(otp) => confirmPhoneChange({ otp })} getRequestError={errorMessage} getConfirmError={errorMessage} onSuccess={(updatedUser) => { setUser(updatedUser); queryClient.setQueryData(["current-user-profile", updatedUser.id], updatedUser); onSuccess?.(updatedUser); toast.success("Phone number changed", { description: "Your new phone number is now verified." }); }} />;
}
