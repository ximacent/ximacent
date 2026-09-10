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

/**
 * Validates each item individually, then checks for duplicate name+election
 * pairs WITHIN the submitted batch itself. A DB uniqueness check alone can't
 * catch this — two brand-new categories with the same name would both look
 * "not yet existing" against the DB until one of them is actually inserted.
 */
export function validateCreateCategoryBatch(data: CreateCategoryDTO[]) {
  if (!Array.isArray(data) || data.length === 0) {
    fail("At least one category is required");
  }

  data.forEach(validateCreateCategory);

  const seen = new Set<string>();
  for (const item of data) {
    const key = `${item.electionId}::${item.name.trim().toLowerCase()}`;
    if (seen.has(key)) {
      fail(`Duplicate category "${item.name}" for the same election within this request`);
    }
    seen.add(key);
  }
}

export function validateUpdateCategory(data: UpdateCategoryDTO) {
  if (data.name !== undefined && !data.name?.trim()) { fail("name cannot be empty"); }

  if (data.displayOrder !== undefined && (!Number.isInteger(data.displayOrder) || data.displayOrder < 0)) {
    fail("displayOrder must be a non-negative integer");
  }
}