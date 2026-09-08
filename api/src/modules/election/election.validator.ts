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

export function validateUpdateElection(
  data: UpdateElectionDTO,
  existing: { startDate: Date; endDate: Date; status: ElectionStatus }
) {
  if (data.title !== undefined && !data.title?.trim()) { fail("title cannot be empty"); }

  if ((data.startDate || data.endDate) && existing.status !== ElectionStatus.DRAFT) {
    fail("dates cannot be changed once the election is no longer in draft");
  }

  const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
  const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

  if (data.startDate && Number.isNaN(new Date(data.startDate).getTime())) { fail("startDate must be a valid date"); }
  if (data.endDate && Number.isNaN(new Date(data.endDate).getTime())) { fail("endDate must be a valid date"); }
  if (endDate <= startDate) { fail("endDate must be after startDate"); }

  // this branch is now dead for non-draft since the guard above already fails,
  // but keep it for the DRAFT case
  if (data.startDate && startDate < new Date()) {
    fail("startDate cannot be in the past");
  }

  if (data.pricePerVote !== undefined) {
    if (existing.status !== ElectionStatus.DRAFT) {
      fail("pricePerVote cannot be changed once the election is no longer in draft");
    }
    if (!isValidPrice(data.pricePerVote)) { fail("pricePerVote must be a positive number"); }
  }
}


const VALID_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  [ElectionStatus.DRAFT]: [ElectionStatus.ACTIVE],
  [ElectionStatus.ACTIVE]: [ElectionStatus.CLOSED],
  [ElectionStatus.CLOSED]: [],
};

export function validateStatusTransition(election: Election, nextStatus: ElectionStatus) {
  if (!Object.values(ElectionStatus).includes(nextStatus)) {
    fail("Invalid status value");
  }

  if (!VALID_TRANSITIONS[election.status].includes(nextStatus)) {
    fail(`Cannot transition election from "${election.status}" to "${nextStatus}"`);
  }

  if (nextStatus === ElectionStatus.ACTIVE && new Date() > election.endDate) {
    fail("Cannot activate an election whose endDate has already passed");
  }
}