import { validate as isUUID } from "uuid";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { InitiatePaymentDTO } from "@/types/payment.type";

function fail(message: string): never {
  throw new CustomAppError( message, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInitiatePayment(data: InitiatePaymentDTO) {
  if (!data.nomineeId || !isUUID(data.nomineeId)) { fail("Valid nomineeId is required"); }
  if (!Number.isInteger(data.quantity) || data.quantity < 1) { fail("quantity must be a positive integer"); }
  if (data.voterEmail !== undefined && !EMAIL_RE.test(data.voterEmail)) { fail("voterEmail must be a valid email if provided"); }
  if (data.voterPhone !== undefined && !data.voterPhone.trim()) { fail("voterPhone cannot be empty if provided"); }
}