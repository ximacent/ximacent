"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/types";
import { resetPassword } from "@/lib/api/users";
import { passwordSchema } from "@/lib/validation/user";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit reset code"),
  newPassword: passwordSchema,
});
type Values = z.infer<typeof schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get("email") ?? "", otp: "", newPassword: "" },
  });

  async function onSubmit(values: Values) {
    setIsSubmitting(true);
    try {
      await resetPassword(values);
      setCompleted(true);
      toast.success("Password reset", { description: "Your new password is ready to use." });
    } catch (error) {
      toast.error("Couldn’t reset password", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full">
          <div className="mb-6 flex items-center justify-between"><Link href="/" className="focus-ring rounded-md"><Image src="/logo.png" alt="Ximacent" width={140} height={28} priority /></Link><Link href="/admin/login" className="focus-ring inline-flex items-center gap-1.5 rounded-md text-xs text-stone hover:text-cream"><ArrowLeft className="h-3.5 w-3.5" /> Sign in</Link></div>
          <div className="surface-card p-6 shadow-elevated sm:p-8">
            {completed ? <div className="py-5 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" /><h1 className="mt-5 font-display text-2xl text-cream">Password updated</h1><p className="mt-2 text-sm text-stone">You can now sign in with your new password.</p><Button asChild className="mt-7 w-full"><Link href="/admin/login">Return to sign in</Link></Button></div> : <><div className="flex h-10 w-10 items-center justify-center rounded-md bg-champagne/15 text-champagne"><KeyRound className="h-5 w-5" /></div><h1 className="mt-6 font-display text-display-sm text-cream">Choose a new password</h1><p className="mt-2 text-sm leading-relaxed text-stone">Enter the six-digit code from your email and create a strong replacement.</p><form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate><div className="space-y-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" type="email" autoComplete="email" disabled={isSubmitting} {...register("email")} />{errors.email && <p className="text-xs text-rose">{errors.email.message}</p>}</div><div className="space-y-2"><Label htmlFor="reset-otp">Reset code</Label><Input id="reset-otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="000000" disabled={isSubmitting} {...register("otp")} />{errors.otp && <p className="text-xs text-rose">{errors.otp.message}</p>}</div><div className="space-y-2"><Label htmlFor="reset-new-password">New password</Label><PasswordInput id="reset-new-password" autoComplete="new-password" placeholder="Create a strong password" disabled={isSubmitting} {...register("newPassword")} />{errors.newPassword && <p className="text-xs text-rose">{errors.newPassword.message}</p>}</div><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : "Reset password"}</Button></form></>}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-ink px-4">
          <Loader2 className="h-6 w-6 animate-spin text-champagne" aria-label="Loading reset form" />
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
