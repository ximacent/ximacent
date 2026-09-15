// PATCH /api/v1/users/:id/role — super_admin only.
// Body: { role: "voter" | "organizer" | "admin" | "super_admin" }
// Handles both promotion and demotion. Blocked if it would leave zero
// super_admin accounts. Notifies the affected user by email.

import { UserController } from "@/modules/user/user.controller";
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
    const data = await req.json();
    const user = await UserController.changeRole(id, data.role, { id: req.user.sub, role: req.user.role });
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, user);
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH = withAuth(patchHandler, { requireRole: UserRole.SUPER_ADMIN });
