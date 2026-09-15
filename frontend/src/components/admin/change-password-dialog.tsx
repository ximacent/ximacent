"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/types";
import { changePassword } from "@/lib/api/users";
import { passwordSchema } from "@/lib/validation/user";
import { z } from "zod";

interface ChangePasswordDialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordDialog({ trigger, open: controlledOpen, onOpenChange }: ChangePasswordDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed", { description: "Your password was updated successfully." });
      reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Couldn’t change password", {
        description: error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
      });
    },
  });

  return (
    <>
      {trigger ?? (
        <Button type="button" variant="ghost" onClick={() => setOpen(true)} disabled={mutation.isPending}>
          <KeyRound className="h-4 w-4" />
          Change password
        </Button>
      )}
      <Dialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Choose a new password for your account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <PasswordInput id="current-password" autoComplete="current-password" disabled={mutation.isPending} {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-xs text-rose">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput id="new-password" autoComplete="new-password" placeholder="Create a strong password" disabled={mutation.isPending} {...register("newPassword")} />
              {errors.newPassword && <p className="text-xs text-rose">{errors.newPassword.message}</p>}
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Update password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
