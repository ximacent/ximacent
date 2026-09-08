import { NomineeController } from "@/modules/nominee/nominee.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { FilterNomineeDTO, CreateNomineeDTO } from "@/types/nominee.type";
import { UserRole } from "@/database/entities/User";
import type { ImageFileInput } from "@/lib/storage/createWithImages";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { PaginationQuery } from "@/types/pagination.type";

async function extractImage(formData: FormData): Promise<ImageFileInput | undefined> {
  const file = formData.get("image");
  if (!file || !(file instanceof File)) return undefined;
  const buffer = Buffer.from(await file.arrayBuffer());
  return { fieldName: "imageUrl", buffer, originalName: file.name };
}

// Get list of nominees with optional filters
  const getHandler: AuthedHandler = async (req, _ctx) => {
    try {
      const params = req.nextUrl.searchParams;
      const filters: FilterNomineeDTO & PaginationQuery = {
        name: params.get("name") ?? undefined,
        categoryId: params.get("categoryId") ?? undefined,
        code: params.get("code") ?? undefined,
        page: params.get("page") ? Number(params.get("page")) : undefined,
        limit: params.get("limit") ? Number(params.get("limit")) : undefined,
      };

      const nominees = await NomineeController.getNominees(filters);
      return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, nominees);
    } catch (error) {
      return handleError(error);
    }
  };

// Create a nominee — admin only. multipart/form-data: name, bio?, categoryId, image?
const postHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const formData = await req.formData();

    const data: CreateNomineeDTO = {
      name: formData.get("name") as string,
      bio: (formData.get("bio") as string | null) ?? undefined,
      categoryId: formData.get("categoryId") as string,
    };

    const image = await extractImage(formData);
    const nominee = await NomineeController.createNominee(data, image);
    return customResponse(SuccessCodes.RECORD_CREATED.code, SuccessCodes.RECORD_CREATED.message, 201, nominee);
  } catch (error) {
    return handleError(error);
  }
};

// Delete nominees by IDs — admin only
const deleteHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const data = await req.json();

    if (!Array.isArray(data.ids) || data.ids.length === 0 || !data.ids.every((id: unknown) => typeof id === "string")) {
      throw new CustomAppError( "A non-empty array of string IDs is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    await NomineeController.deleteNominees(data.ids);
    return customResponse(SuccessCodes.RECORD_DELETED.code, SuccessCodes.RECORD_DELETED.message, 200);
  } catch (error) {
    return handleError(error);
  }
};

export const GET    = withAuth(getHandler);
export const POST   = withAuth(postHandler, { requireRole: UserRole.ADMIN });
export const DELETE = withAuth(deleteHandler, { requireRole: UserRole.ADMIN });