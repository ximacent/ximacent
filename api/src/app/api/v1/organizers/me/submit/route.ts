import { OrganizerController } from "@/modules/organizer/organizer.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";

const postHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const profile = await OrganizerController.submitApplication(req.user.sub);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, profile);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = withAuth(postHandler, { requireRole: UserRole.ORGANIZER });
