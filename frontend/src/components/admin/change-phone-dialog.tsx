"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, type UserSummary } from "@/lib/api/types";
import { confirmPhoneChange, requestPhoneChange } from "@/lib/api/users";
import { useAuth } from "./auth-provider";

interface ChangePhoneDialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (user: UserSummary) => void;
}

type Step = "number" | "otp";

function errorDescription(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 429 || error.key === "rate_limited") return "Too many attempts. Please wait before trying again.";
  if (error.key === "no_pending_phone_change" || error.message.includes("No phone change is currently pending")) return "There is no active phone change. Request a new code first.";
  if (error.key === "invalid_otp" || error.message.toLowerCase().includes("invalid or expired code")) return "That code is invalid or expired. Request a new code and try again.";
  if (error.message.toLowerCase().includes("already your current phone number")) return "That is already your current phone number. Enter a different number.";
  return error.message || fallback;
}

export function ChangePhoneDialog({ trigger, open: controlledOpen, onOpenChange, onSuccess }: ChangePhoneDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<Step>("number");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (!open) {
      setStep("number");
      setNewPhone("");
      setOtp("");
      setError(null);
      setIsBusy(false);
    }
  }, [open]);

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      await requestPhoneChange({ newPhone: newPhone.trim() });
      setStep("otp");
      toast.success("Verification code sent", { description: "The code was sent to your new phone number." });
    } catch (requestError) {
      setError(errorDescription(requestError, "We could not send a verification code."));
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const updatedUser = await confirmPhoneChange({ otp: otp.trim() });
      setUser(updatedUser);
      queryClient.setQueryData(["current-user-profile", updatedUser.id], updatedUser);
      onSuccess?.(updatedUser);
      toast.success("Phone number changed", { description: "Your new phone number is now verified." });
      setOpen(false);
    } catch (confirmError) {
      setError(errorDescription(confirmError, "We could not confirm your phone number."));
    } finally {
      setIsBusy(false);
    }
  }

  function goBack() {
    setStep("number");
    setOtp("");
    setError(null);
  }

  return (
    <>
      {trigger !== undefined ? trigger : (
        <Button type="button" variant="link" className="h-auto p-0 text-xs text-champagne" onClick={() => setOpen(true)}>
          Change
        </Button>
      )}
      <Dialog open={open} onOpenChange={(next) => !isBusy && setOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl"><Phone className="h-5 w-5 text-champagne" />Change phone number</DialogTitle>
            <DialogDescription>{step === "number" ? "Enter the new number you want to verify." : `Enter the six-digit code sent to ${newPhone}.`}</DialogDescription>
          </DialogHeader>

          {step === "number" ? (
            <form onSubmit={sendCode} className="space-y-5" noValidate>
              <div className="space-y-2"><Label htmlFor="new-phone-number">New phone number</Label><Input id="new-phone-number" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 709 8016" value={newPhone} disabled={isBusy} onChange={(event) => setNewPhone(event.target.value)} />{error && <p className="text-sm text-rose-soft" role="alert">{error}</p>}</div>
              <Button type="submit" className="w-full" disabled={isBusy || !newPhone.trim()}>{isBusy ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Send className="h-4 w-4" />Send code</>}</Button>
            </form>
          ) : (
            <form onSubmit={confirmCode} className="space-y-5" noValidate>
              <div className="space-y-2"><Label htmlFor="phone-change-otp">Verification code</Label><Input id="phone-change-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={otp} disabled={isBusy} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center font-mono tracking-[0.35em]" />{error && <p className="text-sm text-rose-soft" role="alert">{error}</p>}</div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={goBack} disabled={isBusy}><ArrowLeft className="h-4 w-4" />Change number</Button><Button type="submit" disabled={isBusy || otp.length !== 6}>{isBusy ? <><Loader2 className="h-4 w-4 animate-spin" />Confirming...</> : <><CheckCircle2 className="h-4 w-4" />Confirm number</>}</Button></div>
            </form>
          )}
          {user && <p className="text-xs text-stone">Your current number is {user.phone || "not set"}.</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
