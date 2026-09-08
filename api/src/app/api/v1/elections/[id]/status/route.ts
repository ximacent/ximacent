import { NextRequest } from "next/server";
import { ElectionController } from "@/modules/election/election.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { UserRole } from "@/database/entities/User";
import { UpdateElectionStatusDTO } from "@/types/election.type";

type RouteContext = { params: Promise<{ id: string }> };

const patchHandler: AuthedHandler = async (req, ctx) => {
  try {
    if (!ctx?.params) throw new CustomAppError( "Missing route parameters", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );

    const { id } = await (ctx.params as unknown as RouteContext["params"]);
    const data: UpdateElectionStatusDTO = await req.json();
    const election = await ElectionController.updateElectionStatus(id, data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, election);
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH = withAuth(patchHandler, { requireRole: UserRole.ADMIN });