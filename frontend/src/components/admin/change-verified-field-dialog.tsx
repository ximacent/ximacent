"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserSummary } from "@/lib/api/types";

export type ChangeVerifiedField = "phone" | "email";

interface ChangeVerifiedFieldDialogProps {
  field: ChangeVerifiedField;
  icon: ReactNode;
  label: string;
  valueLabel: string;
  inputType: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder: string;
  currentValue?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRequest: (value: string) => Promise<unknown>;
  onConfirm: (otp: string) => Promise<UserSummary>;
  onSuccess?: (user: UserSummary) => void;
  getRequestError?: (error: unknown) => string | null;
  getConfirmError?: (error: unknown) => string | null;
  confirmNotice?: (value: string) => ReactNode;
}

type Step = "value" | "otp";

export function ChangeVerifiedFieldDialog({ field, icon, label, valueLabel, inputType, inputMode, placeholder, currentValue, trigger, open: controlledOpen, onOpenChange, onRequest, onConfirm, onSuccess, getRequestError, getConfirmError, confirmNotice }: ChangeVerifiedFieldDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<Step>("value");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (!open) { setStep("value"); setValue(""); setOtp(""); setError(null); setIsBusy(false); }
  }, [open]);

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); event.stopPropagation(); setError(null); setIsBusy(true);
    try { await onRequest(value.trim()); setStep("otp"); }
    catch (requestError) { setError(getRequestError?.(requestError) ?? "We could not send a verification code."); }
    finally { setIsBusy(false); }
  }

  async function confirmCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); event.stopPropagation(); setError(null); setIsBusy(true);
    try { const updatedUser = await onConfirm(otp.trim()); onSuccess?.(updatedUser); setOpen(false); }
    catch (confirmError) { setError(getConfirmError?.(confirmError) ?? "We could not confirm your change."); }
    finally { setIsBusy(false); }
  }

  return <>
    {trigger !== undefined ? trigger : <Button type="button" variant="link" className="h-auto p-0 text-xs text-champagne" onClick={() => setOpen(true)}>Change</Button>}
    <Dialog open={open} onOpenChange={(next) => !isBusy && setOpen(next)}>
      <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2 text-xl">{icon}Change {label}</DialogTitle><DialogDescription>{step === "value" ? `Enter the new ${valueLabel} you want to verify.` : <>Enter the six-digit code sent to <strong className="font-medium text-champagne">{value}</strong>.</>}</DialogDescription></DialogHeader>
        {step === "value" ? <form onSubmit={sendCode} className="space-y-5" noValidate><div className="space-y-2"><Label htmlFor={`new-${field}`}>New {valueLabel}</Label><Input id={`new-${field}`} type={inputType} inputMode={inputMode} autoComplete={field === "email" ? "email" : "tel"} placeholder={placeholder} value={value} disabled={isBusy} onChange={(event) => setValue(event.target.value)} />{error && <p className="text-sm text-rose-soft" role="alert">{error}</p>}</div><Button type="submit" className="w-full" disabled={isBusy || !value.trim()}>{isBusy ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Send className="h-4 w-4" />Send code</>}</Button></form> : <form onSubmit={confirmCode} className="space-y-5" noValidate>{confirmNotice?.(value)}<div className="space-y-2"><Label htmlFor={`${field}-change-otp`}>Verification code</Label><Input id={`${field}-change-otp`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={otp} disabled={isBusy} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center font-mono tracking-[0.35em]" />{error && <p className="text-sm text-rose-soft" role="alert">{error}</p>}</div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={() => { setStep("value"); setOtp(""); setError(null); }} disabled={isBusy}><ArrowLeft className="h-4 w-4" />Change {valueLabel}</Button><Button type="submit" disabled={isBusy || otp.length !== 6}>{isBusy ? <><Loader2 className="h-4 w-4 animate-spin" />Confirming...</> : <><CheckCircle2 className="h-4 w-4" />Confirm {field}</>}</Button></div></form>}
        {currentValue && <p className="text-xs text-stone">Your current {valueLabel} is {currentValue}.</p>}
      </DialogContent>
    </Dialog>
  </>;
}