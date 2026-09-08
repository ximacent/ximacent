import { ElectionController } from "@/modules/election/election.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import type { ImageFileInput } from "@/lib/storage/createWithImages";

type RouteContext = { params: Promise<{ id: string }> };

async function extractBanner(formData: FormData): Promise<ImageFileInput> {
  const file = formData.get("banner");
  if (!file || !(file instanceof File)) {
    throw new CustomAppError( "A banner image file is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { fieldName: "bannerUrl", buffer, originalName: file.name };
}

// Upload/replace an election's banner — admin only. multipart/form-data: banner (file, required)
const patchHandler: AuthedHandler = async (req, ctx) => {
  try {
    if (!ctx?.params) throw new CustomAppError( "Missing route parameters", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );

    const { id } = await (ctx.params as unknown as RouteContext["params"]);
    const formData = await req.formData();
    const image = await extractBanner(formData);
    const election = await ElectionController.updateElectionBanner(id, image);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, election);
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH = withAuth(patchHandler, { requireRole: UserRole.ADMIN });