"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { requestPasswordReset } from "@/lib/api/users";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(values.email);
      setSentEmail(values.email);
      toast.success("Reset code requested", { description: "If an account exists for this email, a code has been sent." });
    } catch (error) {
      toast.error("Couldn’t request reset", { description: error instanceof ApiError ? error.message : "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="focus-ring rounded-md"><Image src="/logo.png" alt="Ximacent" width={140} height={28} priority /></Link>
            <Link href="/admin/login" className="focus-ring inline-flex items-center gap-1.5 rounded-md text-xs text-stone hover:text-cream"><ArrowLeft className="h-3.5 w-3.5" /> Sign in</Link>
          </div>
          <div className="surface-card p-6 shadow-elevated sm:p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-champagne/15 text-champagne"><KeyRound className="h-5 w-5" /></div>
            <h1 className="mt-6 font-display text-display-sm text-cream">Reset your password</h1>
            <p className="mt-2 text-sm leading-relaxed text-stone">Enter your email and we’ll send a one-time reset code if the account exists.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
              <div className="space-y-2"><Label htmlFor="reset-email">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" /><Input id="reset-email" type="email" className="pl-9" placeholder="you@organization.com" autoComplete="email" disabled={isSubmitting} {...register("email")} /></div>{errors.email && <p className="text-xs text-rose">{errors.email.message}</p>}</div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : "Send reset code"}</Button>
            </form>
            {sentEmail && <div className="mt-6 rounded-md border border-emerald-400/25 bg-emerald-400/5 p-4 text-sm text-emerald-300"><p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" />Check your inbox</p><p className="mt-2 text-xs text-emerald-200/80">Enter the code sent to {sentEmail} to choose a new password.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href={`/reset-password?email=${encodeURIComponent(sentEmail)}`}>Continue to reset</Link></Button></div>}
          </div>
        </section>
      </div>
    </main>
  );
}
