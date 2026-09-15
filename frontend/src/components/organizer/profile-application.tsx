"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileImage, Loader2, Save, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/admin/error-state";
import { ApiError } from "@/lib/api/types";
import { mediaUrl } from "@/lib/utils";
import {
  getMyOrganizerProfile,
  getMyOrganizerStatus,
  submitOrganizerApplication,
  updateMyOrganizerProfile,
  type OrganizerProfile,
  type OrganizerVerificationStatus,
  type OrganizationType,
} from "@/lib/api/organizers";
import { getUser, updateUser } from "@/lib/api/users";
import { organizerProfileSchema, type OrganizerProfileFormValues } from "@/lib/validation/organizer";
import { useAuth } from "@/components/admin/auth-provider";

const STATUS_COPY: Record<OrganizerVerificationStatus, { label: string; description: string; className: string }> = {
  not_started: { label: "Profile not submitted", description: "Complete your profile, then submit it for review.", className: "border-champagne/30 bg-champagne/5 text-champagne" },
  pending: { label: "Application under review", description: "Your profile has been submitted. No action is needed right now.", className: "border-champagne/30 bg-champagne/5 text-champagne" },
  approved: { label: "Organizer approved", description: "Your account is approved and can create elections.", className: "border-emerald-400/30 bg-emerald-400/5 text-emerald-300" },
  rejected: { label: "Changes requested", description: "Review the reason below, update your profile, and resubmit.", className: "border-rose/30 bg-rose/5 text-rose-soft" },
  suspended: { label: "Organizer suspended", description: "Election privileges are paused. Contact support if you believe this is an error.", className: "border-rose/30 bg-rose/5 text-rose-soft" },
};

const organizationTypes: Array<{ value: OrganizationType; label: string }> = [
  { value: "individual", label: "Individual" }, { value: "company", label: "Company" }, { value: "ngo", label: "NGO" },
  { value: "school", label: "School" }, { value: "church", label: "Church" }, { value: "government", label: "Government" }, { value: "other", label: "Other" },
];

const ghanaRegions = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East",
  "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North",
];

function ghanaCardDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatGhanaCardNumber(value: string): string {
  const digits = ghanaCardDigits(value);
  if (!digits) return "";
  return `GHA-${digits.slice(0, 9)}${digits.length > 9 ? `-${digits.slice(9)}` : ""}`;
}

function formatGhanaCardInput(value: string): string {
  const digits = ghanaCardDigits(value);
  return digits.length > 9 ? `${digits.slice(0, 9)}-${digits.slice(9)}` : digits;
}

function profileValues(profile?: OrganizerProfile): OrganizerProfileFormValues {
  return {
    organizationName: profile?.organizationName ?? "",
    organizationType: profile?.organizationType,
    region: profile?.region ?? "",
    city: profile?.city ?? "",
    organizationPhone: profile?.organizationPhone ?? "",
    website: profile?.website ?? "",
    socialMediaUrl: profile?.socialMediaUrl ?? "",
    description: profile?.description ?? "",
    ghCardNumber: formatGhanaCardNumber(profile?.ghCardNumber ?? ""),
  };
}

function missingFields(message: string): string[] {
  const match = message.match(/(?:missing|complete the following before submitting)[:\s]+(.+)$/i);
  if (!match) return [];
  return match[1].split(/,|\band\b/i).map((field) => field.trim()).filter(Boolean);
}

function isPhoneVerificationRequirement(field: string): boolean {
  return field.trim().toLowerCase() === "phone verification";
}

function matchesFieldRequirement(field: string, fieldKey: string): boolean {
  const normalized = field.trim().toLowerCase().replace(/[_\s-]/g, "");
  return normalized === fieldKey.toLowerCase().replace(/[_\s-]/g, "");
}

export function ProfileApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [image, setImage] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const profileQuery = useQuery({ queryKey: ["organizer-profile"], queryFn: getMyOrganizerProfile, staleTime: 60_000 });
  const statusQuery = useQuery({ queryKey: ["organizer-status"], queryFn: getMyOrganizerStatus, staleTime: 30_000, refetchInterval: 60_000 });
  const accountUserQuery = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: () => getUser(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const profile = profileQuery.data;
  const status = statusQuery.data?.verificationStatus ?? profile?.verificationStatus ?? "not_started";
  const locked = status === "approved" || status === "suspended";
  const statusCopy = STATUS_COPY[status];
  const [values, setValues] = useState<OrganizerProfileFormValues>(profileValues());
  const [personalPhone, setPersonalPhone] = useState("");
  const [usePersonalPhone, setUsePersonalPhone] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const personalPhoneVerified = accountUserQuery.data?.phoneVerified ?? user?.phoneVerified ?? false;

  useEffect(() => {
    if (profile) setValues(profileValues(profile));
  }, [profile]);

  useEffect(() => {
    const phone = accountUserQuery.data?.phone ?? user?.phone ?? "";
    setPersonalPhone(phone);
    if (phone && profile?.organizationPhone === phone) setUsePersonalPhone(true);
  }, [accountUserQuery.data?.phone, profile?.organizationPhone, user?.phone]);

  useEffect(() => {
    if (accountUserQuery.data?.phoneVerified) {
      setMissing((current) => current.filter((field) => !isPhoneVerificationRequirement(field)));
    }
  }, [accountUserQuery.data?.phoneVerified]);

  useEffect(() => {
    if (missing.length > 0) {
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [missing.length]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const parsed = organizerProfileSchema.safeParse(values);
      if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Check your profile details", 400, { code: "validation_failed", label: "validation_failed", key: "validation_failed" });
      if (!personalPhoneVerified) {
        const updatedUser = await updateUser(user!.id, { phone: personalPhone.trim() });
        queryClient.setQueryData(["current-user-profile", user!.id], updatedUser);
      }
      return updateMyOrganizerProfile({ ...values, organizationPhone: usePersonalPhone ? personalPhone.trim() : values.organizationPhone }, image);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["organizer-profile"], updated);
      setValues(profileValues(updated));
      setImage(undefined);
      setPreview(null);
      setMissing([]);
      toast.success("Profile saved", { description: "Your organizer profile has been updated." });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn’t save profile", { description: message });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const parsed = organizerProfileSchema.safeParse(values);
      if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Check your profile details", 400, { code: "validation_failed", label: "validation_failed", key: "validation_failed" });
      if (!personalPhoneVerified) await updateUser(user!.id, { phone: personalPhone.trim() });
      await updateMyOrganizerProfile({ ...values, organizationPhone: usePersonalPhone ? personalPhone.trim() : values.organizationPhone }, image);
      return submitOrganizerApplication();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["organizer-profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["organizer-status"] });
      setMissing([]);
      toast.success("Application submitted", { description: "Your organizer profile is now under review." });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      const fields = missingFields(message);
      setMissing(fields);
      toast.error("Couldn’t submit application", { description: message });
    },
  });

  if (profileQuery.isLoading || statusQuery.isLoading) return <div className="surface-card mt-8 flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-champagne" /></div>;
  if (profileQuery.isError || statusQuery.isError || !user) return <div className="surface-card mt-8"><ErrorState title="Organizer profile unavailable" description="We couldn’t load your application details." onRetry={() => { profileQuery.refetch(); statusQuery.refetch(); }} /></div>;

  function setField<K extends keyof OrganizerProfileFormValues>(field: K, value: OrganizerProfileFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setMissing((current) => current.filter((item) => !item.toLowerCase().includes(String(field).toLowerCase())));
  }

  function chooseImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Invalid image", { description: "Choose a JPG, PNG, or WEBP image." }); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image is too large", { description: "Choose an image smaller than 5 MB." }); return; }
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function save() {
    const parsed = organizerProfileSchema.safeParse({ ...values, organizationPhone: usePersonalPhone ? personalPhone.trim() : values.organizationPhone });
    if (!parsed.success) { toast.error("Check your profile details", { description: parsed.error.issues[0]?.message }); return; }
    updateMutation.mutate();
  }

  function togglePersonalPhone(checked: boolean) {
    setUsePersonalPhone(checked);
    if (checked) setField("organizationPhone", personalPhone.trim());
    else setField("organizationPhone", "");
  }

  return (
    <section id="organizer-profile" className="surface-card mt-8 scroll-mt-6 overflow-hidden">
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne">Application</p><h2 className="mt-2 font-display text-2xl text-cream">Organizer profile</h2><p className="mt-2 max-w-2xl text-sm text-stone">Tell us about your organization so our team can review your application.</p></div>
          <div className={`rounded-md border px-3 py-2 text-xs ${statusCopy.className}`}><p className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="h-3.5 w-3.5" />{statusCopy.label}</p><p className="mt-1 max-w-[18rem] leading-relaxed opacity-90">{statusCopy.description}</p></div>
        </div>
      </div>

      {status === "rejected" && profile?.rejectionReason && <div className="mx-5 mt-5 flex gap-3 rounded-md border border-rose/30 bg-rose/5 p-4 text-sm text-rose-soft sm:mx-6"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-medium">Reviewer feedback</p><p className="mt-1 leading-relaxed">{profile.rejectionReason}</p></div></div>}
      {missing.length > 0 && <div ref={messageRef} role="alert" className="mx-5 mt-5 scroll-mt-6 rounded-md border border-rose/30 bg-rose/5 p-4 text-sm text-rose-soft sm:mx-6"><p className="font-medium">Complete these items before submitting:</p><ul className="mt-2 space-y-2">{missing.map((field) => <li key={field} className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><span aria-hidden="true">•</span>{field}</span>{isPhoneVerificationRequirement(field) && <Link href="#phone-verification" className="font-medium text-champagne hover:text-champagne-soft">Verify phone</Link>}</li>)}</ul></div>}

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Organization name" id="organization-name" value={values.organizationName ?? ""} disabled={locked} missing={missing} onChange={(value) => setField("organizationName", value)} />
          <div className="space-y-2"><Label htmlFor="organization-type">Organization type</Label><Select value={values.organizationType ?? ""} onValueChange={(value) => setField("organizationType", value as OrganizationType)} disabled={locked}><SelectTrigger id="organization-type"><SelectValue placeholder="Choose a type" /></SelectTrigger><SelectContent>{organizationTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select>{missing.some((field) => field.toLowerCase().includes("organizationtype")) && <p className="text-xs text-rose">Organization type is required.</p>}</div>
          <div className="space-y-2"><Label htmlFor="organization-region">Region</Label><Select value={values.region ?? ""} onValueChange={(value) => setField("region", value)} disabled={locked}><SelectTrigger id="organization-region" className={missing.some((field) => matchesFieldRequirement(field, "region")) ? "border-rose/70" : undefined}><SelectValue placeholder="Choose a Ghana region" /></SelectTrigger><SelectContent>{ghanaRegions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select>{missing.some((field) => matchesFieldRequirement(field, "region")) && <p className="text-xs text-rose">Choose a Ghana region.</p>}</div>
          <Field label="City" id="organization-city" value={values.city ?? ""} disabled={locked} missing={missing} onChange={(value) => setField("city", value)} />
          <div className="space-y-2"><Field label="Organization phone" id="organization-phone" value={values.organizationPhone ?? ""} disabled={locked} missing={missing} onChange={(value) => setField("organizationPhone", value)} /><label className="flex items-start gap-2 text-xs text-stone"><input type="checkbox" checked={usePersonalPhone} disabled={locked || !personalPhone.trim()} onChange={(event) => togglePersonalPhone(event.target.checked)} className="mt-0.5 accent-champagne" />Use my personal phone number as the organization phone number.</label></div>
          <Field label="Website" id="organization-website" value={values.website ?? ""} disabled={locked} missing={missing} onChange={(value) => setField("website", value)} placeholder="https://example.com" />
          <Field label="Social media URL" id="social-media-url" value={values.socialMediaUrl ?? ""} disabled={locked} missing={missing} onChange={(value) => setField("socialMediaUrl", value)} placeholder="https://instagram.com/..." />
          <Field label="Ghana Card number" id="gh-card-number" value={values.ghCardNumber ?? ""} disabled={locked} missing={missing} onChange={(value) => setField("ghCardNumber", value)} placeholder="GHA-XXXXXXXXX-X" />
        </div>

        <div className="space-y-2"><Label htmlFor="organization-description">Description</Label><Textarea id="organization-description" value={values.description ?? ""} disabled={locked} placeholder="Tell us about your organization and the kinds of elections you run." onChange={(event) => setField("description", event.target.value)} />{missing.some((field) => field.toLowerCase().includes("description")) && <p className="text-xs text-rose">Description needs attention.</p>}</div>

        <div className="space-y-3"><Label htmlFor="gh-card-image">Ghana Card image</Label><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start"><label htmlFor="gh-card-image" className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/80 bg-secondary/25 p-4 text-center transition hover:border-champagne/50 ${locked ? "pointer-events-none opacity-60" : ""}`}><FileImage className="h-6 w-6 text-champagne" /><span className="text-sm text-cream">{image ? image.name : "Choose Ghana Card image"}</span><span className="text-xs text-stone">JPG, PNG, or WEBP · max 5 MB</span><Input id="gh-card-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={locked} onChange={(event) => chooseImage(event.target.files?.[0])} /></label>{(preview || profile?.ghCardImageUrl) && <div className="relative aspect-video overflow-hidden rounded-md border border-border/60 bg-secondary"><Image src={preview || mediaUrl(profile?.ghCardImageUrl) || ""} alt="Ghana Card preview" fill className="object-cover" unoptimized /></div>}</div>{missing.some((field) => field.toLowerCase().includes("ghcardimage")) && <p className="text-xs text-rose">Ghana Card image is required.</p>}</div>

        {!locked && <div className="flex flex-col items-stretch gap-3 border-t border-border/60 pt-5 sm:items-end"><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="outline" disabled={updateMutation.isPending || submitMutation.isPending} onClick={save}>{updateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save profile</>}</Button>{(status === "not_started" || status === "rejected") && <Button type="button" disabled={updateMutation.isPending || submitMutation.isPending} onClick={() => submitMutation.mutate()}>{submitMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><Send className="h-4 w-4" />Submit application</>}</Button>}</div>{status === "pending" && <div className={`w-full rounded-md border px-4 py-3 text-left text-sm sm:max-w-md ${statusCopy.className}`} role="status"><p className="font-semibold">{statusCopy.label}</p><p className="mt-1 leading-relaxed opacity-90">{statusCopy.description}</p></div>}</div>}
        {locked && <div className="flex items-center gap-2 border-t border-border/60 pt-5 text-sm text-stone"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Profile editing is locked while this application is {status}.</div>}
      </div>
    </section>
  );
}

function Field({ label, id, value, disabled, missing, onChange, placeholder }: { label: string; id: string; value: string; disabled: boolean; missing: string[]; onChange: (value: string) => void; placeholder?: string }) {
  const fieldKey = id.replace("organization-", "");
  const hasMissing = missing.some((field) => matchesFieldRequirement(field, fieldKey));
  if (id === "gh-card-number") {
    return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className={`flex min-h-10 items-center rounded-md border bg-secondary/25 focus-within:ring-2 focus-within:ring-ring ${hasMissing ? "border-rose/70" : "border-input"}`}><span className="shrink-0 pl-3 text-sm text-stone">GHA-</span><Input id={id} value={formatGhanaCardInput(value)} disabled={disabled} placeholder="123456789-0" inputMode="numeric" maxLength={11} onChange={(event) => onChange(formatGhanaCardNumber(event.target.value))} className="border-0 bg-transparent pl-0 shadow-none focus-visible:ring-0" /></div>{hasMissing && <p className="text-xs text-rose">This field needs attention.</p>}</div>;
  }
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={hasMissing ? "border-rose/70" : undefined} />{hasMissing && <p className="text-xs text-rose">This field needs attention.</p>}</div>;
}
