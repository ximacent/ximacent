import { OrganizerController } from "@/modules/organizer/organizer.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";

// Informational only — canCreateElection here is for the frontend to
// decide what to show. The real enforcement lives in ElectionService,
// which always re-checks the DB independently of this endpoint.
const getHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const summary = await OrganizerController.getStatusSummary(req.user.sub);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, summary);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler);
