"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Save, ShieldCheck, UserCircle2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { getUser, updateUser } from "@/lib/api/users";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validation/user";
import { useAuth } from "./auth-provider";
import { ChangePasswordDialog } from "./change-password-dialog";
import { ChangePhoneDialog } from "./change-phone-dialog";
import { ChangeEmailDialog } from "./change-email-dialog";

export function ProfileTriggerButton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "focus-ring flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm text-stone transition hover:bg-secondary/60 hover:text-cream"
        }
        aria-label={user ? "Open profile" : "Open account"}
        title={user ? "Profile" : "Account"}
      >
        <UserCircle2 className="h-4 w-4" />
        {!compact && (user ? "Profile" : "Account")}
      </button>
      <ProfileDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, setUser } = useAuth();
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
    },
  });

  const { data: profileUser, isLoading, isError, refetch } = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: open && Boolean(user?.id),
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    const current = profileUser ?? user;
    if (!current) return;

    reset({
      firstName: current.firstName ?? "",
      lastName: current.lastName ?? "",
      phone: current.phone ?? "",
    });
  }, [profileUser, user, reset, open]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) {
        throw new Error("No authenticated user found");
      }

      const currentUser = profileUser ?? user;
      return updateUser(user.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        ...(currentUser.phoneVerified ? {} : { phone: values.phone || undefined }),
      });
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Profile updated", {
        description: "Your account details were saved successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Profile update failed", { description: message });
      if (error instanceof ApiError && error.message.includes("phone is verified")) setChangePhoneOpen(true);
    },
  });

  const isBusy = isLoading || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (updateMutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl" showClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserRound className="h-5 w-5 text-champagne" />
            My profile
          </DialogTitle>
          <DialogDescription>
            Manage the contact details associated with your account.
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <div className="space-y-4 rounded-md border border-rose/30 bg-rose/5 p-4 text-sm text-rose-soft">
            <p className="font-medium">We couldn’t load your profile.</p>
            <p className="text-rose/90">Check your connection and try again.</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))} className="space-y-5" noValidate>
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne/15 text-sm font-semibold text-champagne">
                  {user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-cream">
                    {user ? `${user.firstName} ${user.lastName}` : "Account holder"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone">
                    <span className="inline-flex items-center gap-1 rounded-full bg-champagne/10 px-2 py-1 text-champagne">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {user?.role ?? "admin"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-first-name">First name</Label>
                <Input
                  id="profile-first-name"
                  placeholder="Ama"
                  disabled={isBusy}
                  autoComplete="given-name"
                  {...register("firstName")}
                />
                {errors.firstName && <p className="text-xs text-rose">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-last-name">Last name</Label>
                <Input
                  id="profile-last-name"
                  placeholder="Owusu"
                  disabled={isBusy}
                  autoComplete="family-name"
                  {...register("lastName")}
                />
                {errors.lastName && <p className="text-xs text-rose">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border/60 bg-secondary/25 px-3 py-2 text-sm text-stone">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-stone" />
                  <span className="truncate">{user?.email ?? ""}</span>
                </div>
                <ChangeEmailDialog />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              {(profileUser ?? user)?.phoneVerified ? (
                <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border/60 bg-secondary/25 px-3 py-2 text-sm text-stone"><span>{(profileUser ?? user)?.phone || "No phone number"}</span><ChangePhoneDialog open={changePhoneOpen} onOpenChange={setChangePhoneOpen} /></div>
              ) : (
                <>
                  <Input id="profile-phone" type="tel" placeholder="020 123 4567" disabled={isBusy} autoComplete="tel" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-rose">{errors.phone.message}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
                Cancel
              </Button>
              <ChangePasswordDialog />
              <Button type="submit" disabled={isBusy || !isDirty}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
