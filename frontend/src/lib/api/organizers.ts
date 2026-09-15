import { apiClient } from "./client";
import type { UserSummary } from "./types";

export type OrganizationType =
  | "individual"
  | "company"
  | "ngo"
  | "school"
  | "church"
  | "government"
  | "other";

export type OrganizerVerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export interface OrganizerProfile {
  id: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  region?: string;
  city?: string;
  organizationPhone?: string;
  website?: string;
  socialMediaUrl?: string;
  description?: string;
  ghCardNumber?: string;
  ghCardImageUrl?: string;
  verificationStatus: OrganizerVerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  user?: UserSummary;
}

export interface OrganizerStatusSummary {
  role: string;
  emailVerified: boolean;
  /** The current backend status endpoint does not include this field. */
  phoneVerified?: boolean;
  verificationStatus: OrganizerVerificationStatus;
  canCreateElection: boolean;
  rejectionReason?: string;
}

export interface UpdateOrganizerProfileBody {
  organizationName?: string;
  organizationType?: OrganizationType;
  region?: string;
  city?: string;
  organizationPhone?: string;
  website?: string;
  socialMediaUrl?: string;
  description?: string;
  ghCardNumber?: string;
}

export function getMyOrganizerProfile() {
  return apiClient<OrganizerProfile>("/api/v1/organizers/me");
}

export function getMyOrganizerStatus() {
  return apiClient<OrganizerStatusSummary>("/api/v1/organizers/me/status");
}

export function updateMyOrganizerProfile(body: UpdateOrganizerProfileBody, image?: File) {
  if (!image) {
    return apiClient<OrganizerProfile>("/api/v1/organizers/me", { method: "PATCH", body });
  }

  const formData = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== "") formData.append(key, value);
  });
  formData.append("ghCardImage", image);

  return apiClient<OrganizerProfile>("/api/v1/organizers/me", {
    method: "PATCH",
    formData,
  });
}

export function submitOrganizerApplication() {
  return apiClient<OrganizerProfile>("/api/v1/organizers/me/submit", { method: "POST" });
}
