import { NextRequest } from "next/server";
import { OrganizerController } from "@/modules/organizer/organizer.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";
import { FilterOrganizerDTO } from "@/types/organizer.type";
import { PaginationQuery } from "@/types/pagination.type";

const getHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const params = req.nextUrl.searchParams;
    const filters: FilterOrganizerDTO & PaginationQuery = {
      verificationStatus: (params.get("verificationStatus") as FilterOrganizerDTO["verificationStatus"]) ?? undefined,
      search: params.get("search") ?? undefined,
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    };

    const result = await OrganizerController.listForAdmin(filters);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler, { requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN] });
