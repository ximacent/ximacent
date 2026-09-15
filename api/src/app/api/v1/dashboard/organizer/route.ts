// GET /api/v1/dashboard/organizer — organizer only.
// Analytics scoped to the authenticated organizer's own elections.
// The organizer id comes from the JWT (req.user.sub), never from a query
// param — so there is no id to tamper with and no way to read another
// organizer's analytics.

import { DashboardController } from "@/modules/dashboard/dashboard.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";

const getHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const dashboard = await DashboardController.getOrganizerDashboard(req.user.sub);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, dashboard);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler, { requireRole: UserRole.ORGANIZER });
