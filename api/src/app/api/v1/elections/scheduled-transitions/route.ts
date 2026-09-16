// POST /api/v1/elections/scheduled-transitions
// Not user-authenticated — this is called by an external scheduler
// (Render Cron Job, cron-job.org, GitHub Actions scheduled workflow,
// etc.), not a logged-in person, so withAuth's JWT check doesn't apply
// here. Protected instead by a shared secret header:
//   x-cron-secret: <CRON_SECRET env var>
// Point your scheduler at this URL every 5-15 minutes. Idempotent — safe
// to call repeatedly; elections not yet due are simply skipped.

import { NextRequest } from "next/server";
import { ElectionService } from "@/modules/election/election.service";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      // Fail closed: if the secret isn't configured, refuse rather than
      // silently accepting unauthenticated calls to a mutating endpoint.
      throw new CustomAppError("Scheduled transitions are not configured", 500, ErrorCodes.INTERNAL_SERVER_ERROR.code, ErrorCodes.INTERNAL_SERVER_ERROR.label, "cron_not_configured");
    }

    const provided = req.headers.get("x-cron-secret");
    if (provided !== secret) {
      throw new CustomAppError("Unauthorized", 401, ErrorCodes.UNAUTHORIZED_ACCESS.code, ErrorCodes.UNAUTHORIZED_ACCESS.label, "unauthorized");
    }

    const result = await ElectionService.runScheduledTransitions();
    return customResponse(SuccessCodes.RECORD_UPDATED.code, "Scheduled transitions processed", 200, result);
  } catch (error) {
    return handleError(error);
  }
}
