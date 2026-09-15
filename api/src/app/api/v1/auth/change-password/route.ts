// POST /api/v1/auth/change-password — authenticated.
// Body: { currentPassword, newPassword }

import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";

const postHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const data = await req.json();
    const result = await AuthController.changePassword(req.user.sub, data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = withAuth(postHandler);
