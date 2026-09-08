import { NomineeController } from "@/modules/nominee/nominee.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UpdateNomineeDTO } from "@/types/nominee.type";
import { UserRole } from "@/database/entities/User";
import type { ImageFileInput } from "@/lib/storage/createWithImages";

async function extractImage(formData: FormData): Promise<ImageFileInput | undefined> {
  const file = formData.get("image");
  if (!file || !(file instanceof File)) return undefined;
  const buffer = Buffer.from(await file.arrayBuffer());
  return { fieldName: "imageUrl", buffer, originalName: file.name };
}

const getHandler: AuthedHandler = async (_req, ctx) => {
  try {
    const { id } = await ctx!.params;
    const nominee = await NomineeController.getNominee(id);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, nominee);
  } catch (error) {
    return handleError(error);
  }
};

// Update a nominee — admin only. multipart/form-data: name?, bio?, categoryId?, image?
const patchHandler: AuthedHandler = async (req, ctx) => {
  try {
    const { id } = await ctx!.params;
    const formData = await req.formData();

    const data: UpdateNomineeDTO = {
      ...(formData.has("name") && { name: formData.get("name") as string }),
      ...(formData.has("bio") && { bio: formData.get("bio") as string }),
      ...(formData.has("categoryId") && { categoryId: formData.get("categoryId") as string }),
    };

    const image = await extractImage(formData);
    const nominee = await NomineeController.updateNominee(id, data, image);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, nominee);
  } catch (error) {
    return handleError(error);
  }
};

export const GET   = withAuth(getHandler);
export const PATCH = withAuth(patchHandler, { requireRole: UserRole.ADMIN });