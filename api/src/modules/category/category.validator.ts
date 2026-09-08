import { validate as isUUID } from "uuid";

import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { CreateCategoryDTO, UpdateCategoryDTO } from "@/types/category.type";

function fail(message: string): never {
  throw new CustomAppError( message, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
}

export function validateCreateCategory(data: CreateCategoryDTO) {
  if (!data.name?.trim()) { fail("name is required"); }

  if (!data.electionId || !isUUID(data.electionId)) { fail("Valid electionId is required"); }

  if (data.displayOrder !== undefined && (!Number.isInteger(data.displayOrder) || data.displayOrder < 0)) {
    fail("displayOrder must be a non-negative integer");
  }
}

export function validateUpdateCategory(data: UpdateCategoryDTO) {
  if (data.name !== undefined && !data.name?.trim()) { fail("name cannot be empty"); }

  if (data.displayOrder !== undefined && (!Number.isInteger(data.displayOrder) || data.displayOrder < 0)) {
    fail("displayOrder must be a non-negative integer");
  }
}