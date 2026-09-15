import type { OrganizationType, OrganizerVerificationStatus } from "@/database/entities/OrganizerProfile";

// ── Update own profile (organizer, self) ───────────────────────────
// Never includes verificationStatus/reviewedAt/reviewedBy/rejectionReason —
// those are admin/system-controlled only. Enforced again in the sanitizer,
// not just by this type.
export type UpdateOrganizerProfileDTO = Partial<{
  organizationName: string;
  organizationType: OrganizationType;
  region: string;
  city: string;
  organizationPhone: string;
  website: string;
  socialMediaUrl: string;
  description: string;
  ghCardNumber: string;
}>;

// ── Admin review actions ────────────────────────────────────────────
export type RejectOrganizerDTO = {
  rejectionReason: string;
};

// ── Filter (admin list) ─────────────────────────────────────────────
export type FilterOrganizerDTO = {
  verificationStatus?: OrganizerVerificationStatus;
  search?: string;
};

// ── Frontend-facing status summary (section 20 of the spec) ────────
// Informational only — the real enforcement happens server-side wherever
// an action is attempted, never based on this payload.
export type OrganizerStatusSummary = {
  role: string;
  emailVerified: boolean;
  verificationStatus: OrganizerVerificationStatus;
  canCreateElection: boolean;
  rejectionReason?: string;
};
