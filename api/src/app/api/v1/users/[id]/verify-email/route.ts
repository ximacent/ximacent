// PATCH /api/v1/users/:id/verify-email — admin only
// Marks a user's email as verified without an OTP. Support-override use
// case only (e.g. a user genuinely never receives mail).

import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { UserRole } from "@/database/entities/User";

type RouteContext = { params: Promise<{ id: string }> };

const patchHandler: AuthedHandler = async (req, ctx) => {
  try {
    if (!ctx?.params) throw new CustomAppError("Missing route parameters", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");

    const { id } = await (ctx.params as unknown as RouteContext["params"]);
    const user = await AuthController.adminVerifyEmail(id, req.user.sub);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, user);
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH = withAuth(patchHandler, { requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN] });
