import { DashboardController } from "@/modules/dashboard/dashboard.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";

const getHandler: AuthedHandler = async (_req, _ctx) => {
  try {
    const dashboard = await DashboardController.getDashboard();
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, dashboard);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler, { requireRole: UserRole.ADMIN });