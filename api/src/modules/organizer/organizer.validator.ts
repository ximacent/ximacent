import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { OrganizationType, OrganizerProfile, OrganizerVerificationStatus } from "@/database/entities/OrganizerProfile";
import { RejectOrganizerDTO, UpdateOrganizerProfileDTO } from "@/types/organizer.type";

function fail(message: string): never {
  throw new CustomAppError(message, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
}

const GH_CARD_REGEX = /^GHA-\d{9}-\d$/;

export function validateUpdateOrganizerProfile(data: UpdateOrganizerProfileDTO) {
  if (data.organizationName !== undefined && !data.organizationName.trim()) fail("organizationName cannot be empty");
  if (data.organizationType !== undefined && !Object.values(OrganizationType).includes(data.organizationType)) {
    fail(`organizationType must be one of: ${Object.values(OrganizationType).join(", ")}`);
  }
  if (data.region !== undefined && !data.region.trim()) fail("region cannot be empty");
  if (data.city !== undefined && !data.city.trim()) fail("city cannot be empty");
  if (data.organizationPhone !== undefined && !data.organizationPhone.trim()) fail("organizationPhone cannot be empty");
  if (data.ghCardNumber !== undefined) {
    const normalized = data.ghCardNumber.trim().toUpperCase();
    if (!GH_CARD_REGEX.test(normalized)) {
      fail("ghCardNumber must be a valid Ghana Card number in the format GHA-XXXXXXXXX-X");
    }
  }
}

// Required before an organizer can submit for review: their identity
// checks (email + phone OTP) must both be done first, and their profile
// fields must be complete. Identity checks were previously only
// email — phone OTP is now equally required, since it's a materially
// stronger signal than email alone. See organizer.service.ts for why this
// takes `user` as well as `profile`.
export function validateReadyForSubmission(profile: OrganizerProfile, user: { emailVerified: boolean; phoneVerified: boolean }) {
  const missing: string[] = [];
  if (!user.emailVerified) missing.push("email verification");
  if (!user.phoneVerified) missing.push("phone verification");
  if (!profile.organizationName?.trim()) missing.push("organizationName");
  if (!profile.organizationType) missing.push("organizationType");
  if (!profile.region?.trim()) missing.push("region");
  if (!profile.city?.trim()) missing.push("city");
  if (!profile.description?.trim()) missing.push("description");
  if (!profile.ghCardNumber?.trim()) missing.push("ghCardNumber");
  if (!profile.ghCardImageUrl?.trim()) missing.push("ghCardImageUrl");

  if (missing.length > 0) {
    fail(`Complete the following before submitting: ${missing.join(", ")}`);
  }
}

export function validateRejectOrganizer(data: RejectOrganizerDTO) {
  if (!data.rejectionReason?.trim()) fail("rejectionReason is required when rejecting an organizer");
}

// ── State machine ───────────────────────────────────────────────
// NOT_STARTED → PENDING            (submit)
// PENDING     → APPROVED | REJECTED (admin review)
// REJECTED    → PENDING            (edit + resubmit)
// APPROVED    → SUSPENDED          (admin action)
// SUSPENDED   → APPROVED           (admin reinstates)
const VALID_TRANSITIONS: Record<OrganizerVerificationStatus, OrganizerVerificationStatus[]> = {
  [OrganizerVerificationStatus.NOT_STARTED]: [OrganizerVerificationStatus.PENDING],
  [OrganizerVerificationStatus.PENDING]: [OrganizerVerificationStatus.APPROVED, OrganizerVerificationStatus.REJECTED],
  [OrganizerVerificationStatus.REJECTED]: [OrganizerVerificationStatus.PENDING],
  [OrganizerVerificationStatus.APPROVED]: [OrganizerVerificationStatus.SUSPENDED],
  [OrganizerVerificationStatus.SUSPENDED]: [OrganizerVerificationStatus.APPROVED],
};

export function validateVerificationStatusTransition(
  current: OrganizerVerificationStatus,
  next: OrganizerVerificationStatus
) {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new CustomAppError(
      `Cannot transition organizer status from "${current}" to "${next}"`,
      400,
      ErrorCodes.INVALID_STATE.code,
      ErrorCodes.INVALID_STATE.label,
      "invalid_verification_state"
    );
  }
}
