import type { UpdateOrganizerProfileDTO } from "@/types/organizer.type";

export class OrganizerSanitizer {
  // Deliberately excludes verificationStatus, submittedAt, reviewedAt,
  // reviewedBy, rejectionReason — those are system/admin-controlled only.
  // A client sending any of those fields has them silently dropped, same
  // pattern as UserSanitizer.update. ghCardImageUrl is also excluded here
  // on purpose — it's only ever set via the dedicated upload endpoint
  // (PATCH /organizers/me/gh-card-image), the same way election.bannerUrl
  // isn't part of the plain election update either.
  private static readonly UPDATABLE_FIELDS = [
    "organizationName",
    "organizationType",
    "region",
    "city",
    "organizationPhone",
    "website",
    "socialMediaUrl",
    "description",
    "ghCardNumber",
  ] as const;

  static update(data: unknown): UpdateOrganizerProfileDTO {
    const sanitized: Record<string, unknown> = {};
    if (!data || typeof data !== "object") return sanitized as UpdateOrganizerProfileDTO;

    for (const key of this.UPDATABLE_FIELDS) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) sanitized[key] = value;
    }

    return sanitized as UpdateOrganizerProfileDTO;
  }
}
