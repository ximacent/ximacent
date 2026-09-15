import { OrganizerController } from "@/modules/organizer/organizer.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import type { ImageFileInput } from "@/lib/storage/createWithImages";

async function extractGhCardImage(formData: FormData): Promise<ImageFileInput> {
  const file = formData.get("ghCardImage");
  if (!file || !(file instanceof File)) {
    throw new CustomAppError("A ghCardImage file is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { fieldName: "ghCardImageUrl", buffer, originalName: file.name };
}

// Upload/replace the authenticated organizer's own Ghana Card image.
// multipart/form-data: ghCardImage (file, required)
const patchHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const formData = await req.formData();
    const image = await extractGhCardImage(formData);
    const profile = await OrganizerController.uploadGhCardImage(req.user.sub, image);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, profile);
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH = withAuth(patchHandler, { requireRole: UserRole.ORGANIZER });
