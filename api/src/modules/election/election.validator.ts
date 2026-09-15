import { validate as isUUID } from "uuid";

import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { CreateElectionDTO, UpdateElectionDTO } from "@/types/election.type";
import { Election, ElectionStatus } from "@/database/entities/Election";

function fail(message: string): never {
  throw new CustomAppError( message, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
}

function isValidPrice(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export function validateCreateElection(data: CreateElectionDTO) {
  if (!data.title?.trim()) { fail("title is required"); }
  if (!data.startDate) { fail("startDate is required"); }
  if (!data.endDate) { fail("endDate is required"); }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (Number.isNaN(startDate.getTime())) { fail("startDate must be a valid date"); }
  if (Number.isNaN(endDate.getTime())) { fail("endDate must be a valid date"); }
  if (endDate <= startDate) { fail("endDate must be after startDate"); }
  if (startDate < new Date()) { fail("startDate cannot be in the past"); }  // ← added

  if (data.pricePerVote === undefined || data.pricePerVote === null) { fail("pricePerVote is required"); }
  if (!isValidPrice(data.pricePerVote)) { fail("pricePerVote must be a positive number"); }
}

// Editable while the organizer is still shaping it (DRAFT) or fixing it up
// after a rejection (REJECTED) — anything after that (submitted/approved/
// active/closed) is frozen except via the status-transition endpoint.
const EDITABLE_STATUSES: ElectionStatus[] = [ElectionStatus.DRAFT, ElectionStatus.REJECTED];

export function validateUpdateElection(
  data: UpdateElectionDTO,
  existing: { startDate: Date; endDate: Date; status: ElectionStatus }
) {
  if (data.title !== undefined && !data.title?.trim()) { fail("title cannot be empty"); }

  if (!EDITABLE_STATUSES.includes(existing.status)) {
    fail(`Election details cannot be changed while status is "${existing.status}"`);
  }

  const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
  const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

  if (data.startDate && Number.isNaN(new Date(data.startDate).getTime())) { fail("startDate must be a valid date"); }
  if (data.endDate && Number.isNaN(new Date(data.endDate).getTime())) { fail("endDate must be a valid date"); }
  if (endDate <= startDate) { fail("endDate must be after startDate"); }

  if (data.startDate && startDate < new Date()) {
    fail("startDate cannot be in the past");
  }

  if (data.pricePerVote !== undefined && !isValidPrice(data.pricePerVote)) {
    fail("pricePerVote must be a positive number");
  }
}


// ── Status state machine ────────────────────────────────────────
// DRAFT          → PENDING_REVIEW               (organizer submits)
// PENDING_REVIEW → APPROVED | REJECTED           (admin reviews)
// REJECTED       → PENDING_REVIEW                (organizer edits + resubmits)
// APPROVED       → ACTIVE                        (admin launches)
// ACTIVE         → CLOSED                        (admin closes)
// CLOSED         → (terminal)
//
// Note DRAFT → ACTIVE is not a valid transition at all, for either role —
// this is what makes "organizer cannot directly activate their own
// election" a backend guarantee rather than a role check that could be
// bypassed if the transition existed but was merely gated.
const VALID_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  [ElectionStatus.DRAFT]: [ElectionStatus.PENDING_REVIEW],
  [ElectionStatus.PENDING_REVIEW]: [ElectionStatus.APPROVED, ElectionStatus.REJECTED],
  [ElectionStatus.REJECTED]: [ElectionStatus.PENDING_REVIEW],
  [ElectionStatus.APPROVED]: [ElectionStatus.ACTIVE],
  [ElectionStatus.ACTIVE]: [ElectionStatus.CLOSED],
  [ElectionStatus.CLOSED]: [],
};

// Which role may *request* each transition. Checked in addition to
// VALID_TRANSITIONS above and to per-election ownership (checked in the
// service, which also re-verifies organizer approval status from the DB).
const ORGANIZER_ALLOWED_TARGETS: ElectionStatus[] = [ElectionStatus.PENDING_REVIEW];
const ADMIN_ALLOWED_TARGETS: ElectionStatus[] = [
  ElectionStatus.APPROVED,
  ElectionStatus.REJECTED,
  ElectionStatus.ACTIVE,
  ElectionStatus.CLOSED,
];

export function validateStatusTransition(
  election: Election,
  nextStatus: ElectionStatus,
  actorRole: "organizer" | "admin"
) {
  if (!Object.values(ElectionStatus).includes(nextStatus)) {
    fail("Invalid status value");
  }

  if (!VALID_TRANSITIONS[election.status].includes(nextStatus)) {
    fail(`Cannot transition election from "${election.status}" to "${nextStatus}"`);
  }

  const allowedTargets = actorRole === "admin" ? ADMIN_ALLOWED_TARGETS : ORGANIZER_ALLOWED_TARGETS;
  if (!allowedTargets.includes(nextStatus)) {
    fail(`You are not permitted to move an election to "${nextStatus}"`);
  }

  if (nextStatus === ElectionStatus.ACTIVE) {
    if (election.categories && election.categories.length === 0) {
      fail("Cannot activate an election with no categories");
    }
    if (new Date() > election.endDate) {
      fail("Cannot activate an election whose endDate has already passed");
    }
  }
}

export function validateRejectElection(rejectionReason: string | undefined) {
  if (!rejectionReason?.trim()) {
    fail("rejectionReason is required when rejecting an election");
  }
}