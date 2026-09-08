"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { createUserFormSchema, type CreateUserFormValues } from "@/lib/validation/user";

export interface UserFormProps {
  isSubmitting: boolean;
  onSubmit: (values: CreateUserFormValues) => void;
  onCancel: () => void;
}

export function UserForm({ isSubmitting, onSubmit, onCancel }: UserFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const password = watch("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-first-name">First name</Label>
          <Input
            id="user-first-name"
            placeholder="Ama"
            disabled={isSubmitting}
            autoComplete="given-name"
            autoFocus
            {...register("firstName")}
          />
          {errors.firstName && <p className="text-xs text-rose">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-last-name">Last name</Label>
          <Input
            id="user-last-name"
            placeholder="Owusu"
            disabled={isSubmitting}
            autoComplete="family-name"
            {...register("lastName")}
          />
          {errors.lastName && <p className="text-xs text-rose">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          placeholder="ama@ximacent.com"
          disabled={isSubmitting}
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-rose">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-phone">Phone</Label>
        <Input
          id="user-phone"
          type="tel"
          placeholder="0201234567"
          disabled={isSubmitting}
          autoComplete="tel"
          {...register("phone")}
        />
        {errors.phone && <p className="text-xs text-rose">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-password">Password</Label>
        <PasswordInput
          id="user-password"
          placeholder="Choose a strong password"
          disabled={isSubmitting}
          autoComplete="new-password"
          {...register("password")}
        />
        <PasswordStrengthMeter password={password} />
        {errors.password && <p className="text-xs text-rose">{errors.password.message}</p>}
      </div>

      <p className="text-xs text-stone">
        New users are created with admin access to this control panel.
      </p>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create user"
          )}
        </Button>
      </div>
    </form>
  );
}
