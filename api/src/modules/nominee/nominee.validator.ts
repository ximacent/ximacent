import { validate as isUUID } from "uuid";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { CreateNomineeDTO, UpdateNomineeDTO } from "@/types/nominee.type";

function fail(message: string): never {
  throw new CustomAppError( message, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
}

export function validateCreateNominee(data: CreateNomineeDTO) {
  if (!data.name?.trim()) { fail("name is required"); }
  if (!data.categoryId || !isUUID(data.categoryId)) { fail("Valid categoryId is required"); }
}

export function validateUpdateNominee(data: UpdateNomineeDTO) {
  if (data.name !== undefined && !data.name?.trim()) { fail("name cannot be empty"); }
  if (data.categoryId !== undefined && !isUUID(data.categoryId)) { fail("Valid categoryId is required"); }
}