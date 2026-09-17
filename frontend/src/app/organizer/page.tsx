"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, BriefcaseBusiness, Loader2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/types";
import { login, register } from "@/lib/api/users";
import { passwordSchema } from "@/lib/validation/user";
import { useAuth } from "@/components/admin/auth-provider";
import { titleCase } from "@/lib/formatters";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255, "Email is too long"),
  phone: z.string().trim().min(1, "Phone number is required").max(30, "Phone number is too long"),
  password: passwordSchema,
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type Mode = "login" | "register";

function destinationForUser(user: { role: string; emailVerified?: boolean }): string {
  if (user.role === "organizer") return user.emailVerified ? "/organizer/dashboard" : "/organizer/verify-email";
  if (user.role === "admin" || user.role === "super_admin") return "/admin";
  return "/";
}

export default function OrganizerPortalPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function handleLogin(values: LoginValues) {
    setIsSubmitting(true);
    try {
      const result = await login(values);
      setUser(result.user);
      router.replace(destinationForUser(result.user));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Sign in failed", { description: message });
      setIsSubmitting(false);
    }
  }

  async function handleRegister(values: RegisterValues) {
    setIsSubmitting(true);
    try {
      const result = await register({ ...values, firstName: titleCase(values.firstName), lastName: titleCase(values.lastName), role: "organizer" });
      setUser(result.user);
      toast.success("Organizer account created", {
        description: "Check your inbox to verify your email before entering the workspace.",
      });
      router.replace(destinationForUser(result.user));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Registration failed", { description: message });
      setIsSubmitting(false);
    }
  }

  const firstNameField = registerForm.register("firstName");
  const lastNameField = registerForm.register("lastName");

  function changeMode(nextMode: Mode) {
    if (isSubmitting) return;
    setMode(nextMode);
    loginForm.reset();
    registerForm.reset();
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden max-w-md lg:block">
          <Link href="/" className="focus-ring inline-flex rounded-md">
            <Image src="/logo.png" alt="Ximacent" width={160} height={32} priority />
          </Link>
          <p className="mt-16 text-xs font-semibold uppercase tracking-[0.2em] text-champagne">Organizer portal</p>
          <h1 className="mt-4 font-display text-display-lg text-cream">Bring your next vote to life.</h1>
          <p className="mt-5 text-base leading-relaxed text-stone">
            Create trusted, memorable voting experiences for awards, pageants, communities, and organizations.
          </p>
          <div className="mt-8 space-y-4 text-sm text-cream-muted">
            <p className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-champagne" /> Verified organizer access</p>
            <p className="flex items-center gap-3"><BriefcaseBusiness className="h-4 w-4 text-champagne" /> Manage elections from one place</p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="focus-ring rounded-md"><Image src="/logo.png" alt="Ximacent" width={140} height={28} priority /></Link>
            <Link href="/" className="focus-ring inline-flex items-center gap-1.5 rounded-md text-xs text-stone hover:text-cream"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
          </div>

          <div className="surface-card p-6 shadow-elevated sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-champagne/15 text-champagne"><UserRound className="h-5 w-5" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-champagne">Organizer access</p><p className="mt-1 text-xs text-stone">Secure account entry</p></div>
            </div>

            <h2 className="mt-7 font-display text-display-sm text-cream">{mode === "login" ? "Welcome back" : "Create your organizer account"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone">{mode === "login" ? "Sign in to manage your organization and elections." : "Start your organizer application with your personal details."}</p>

            <div className="mt-7 grid grid-cols-2 rounded-md bg-secondary/60 p-1" role="tablist" aria-label="Organizer access mode">
              <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")} className={`rounded-sm px-3 py-2 text-sm font-medium transition ${mode === "login" ? "bg-card text-cream shadow-soft" : "text-stone hover:text-cream"}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")} className={`rounded-sm px-3 py-2 text-sm font-medium transition ${mode === "register" ? "bg-card text-cream shadow-soft" : "text-stone hover:text-cream"}`}>Register</button>
            </div>

            {mode === "login" ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="mt-7 space-y-5" noValidate>
                <div className="space-y-2"><Label htmlFor="organizer-login-email">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" /><Input id="organizer-login-email" type="email" className="pl-9" placeholder="you@organization.com" autoComplete="email" disabled={isSubmitting} {...loginForm.register("email")} /></div>{loginForm.formState.errors.email && <p className="text-xs text-rose">{loginForm.formState.errors.email.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="organizer-login-password">Password</Label><PasswordInput id="organizer-login-password" placeholder="Enter your password" autoComplete="current-password" disabled={isSubmitting} {...loginForm.register("password")} />{loginForm.formState.errors.password && <p className="text-xs text-rose">{loginForm.formState.errors.password.message}</p>}</div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : "Sign in to portal"}</Button>
                <p className="text-right text-sm"><Link href="/forgot-password" className="text-champagne hover:text-champagne-soft">Forgot password?</Link></p>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="mt-7 space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="organizer-first-name">First name</Label><Input id="organizer-first-name" placeholder="Ama" autoComplete="given-name" disabled={isSubmitting} {...firstNameField} onBlur={(event) => { firstNameField.onBlur(event); registerForm.setValue("firstName", titleCase(event.target.value), { shouldDirty: true, shouldValidate: true }); }} />{registerForm.formState.errors.firstName && <p className="text-xs text-rose">{registerForm.formState.errors.firstName.message}</p>}</div><div className="space-y-2"><Label htmlFor="organizer-last-name">Last name</Label><Input id="organizer-last-name" placeholder="Owusu" autoComplete="family-name" disabled={isSubmitting} {...lastNameField} onBlur={(event) => { lastNameField.onBlur(event); registerForm.setValue("lastName", titleCase(event.target.value), { shouldDirty: true, shouldValidate: true }); }} />{registerForm.formState.errors.lastName && <p className="text-xs text-rose">{registerForm.formState.errors.lastName.message}</p>}</div></div>
                <div className="space-y-2"><Label htmlFor="organizer-register-email">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" /><Input id="organizer-register-email" type="email" className="pl-9" placeholder="you@organization.com" autoComplete="email" disabled={isSubmitting} {...registerForm.register("email")} /></div>{registerForm.formState.errors.email && <p className="text-xs text-rose">{registerForm.formState.errors.email.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="organizer-phone">Phone</Label><div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" /><Input id="organizer-phone" type="tel" className="pl-9" placeholder="020 123 4567" autoComplete="tel" disabled={isSubmitting} {...registerForm.register("phone")} /></div>{registerForm.formState.errors.phone && <p className="text-xs text-rose">{registerForm.formState.errors.phone.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="organizer-register-password">Password</Label><PasswordInput id="organizer-register-password" placeholder="Create a strong password" autoComplete="new-password" disabled={isSubmitting} {...registerForm.register("password")} />{registerForm.formState.errors.password && <p className="text-xs text-rose">{registerForm.formState.errors.password.message}</p>}</div>
                <p className="text-xs leading-relaxed text-stone">Your organizer application will continue with email and phone verification after registration.</p>
                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : "Create organizer account"}</Button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-stone">Voters can browse elections and vote without using the organizer portal.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
