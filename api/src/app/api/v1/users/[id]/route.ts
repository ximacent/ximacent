import { NextRequest } from "next/server";
import { UserController } from "@/modules/user/user.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";

type RouteContext = { params: Promise<{ id: string }> };

// Get a single user by ID
const getHandler: AuthedHandler = async (_req, ctx) => {
  try {
    if (!ctx?.params) throw new CustomAppError( "Missing route parameters", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );

    const { id } = await (ctx.params as unknown as RouteContext["params"]);
    const user = await UserController.getUser(id);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, user);
  } catch (error) {
    return handleError(error);
  }
};

// Update an existing user — admin only
const patchHandler: AuthedHandler = async (req, ctx) => {
  try {
    if (!ctx?.params) throw new CustomAppError( "Missing route parameters", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );

    const data = await req.json();
    const { id } = await (ctx.params as unknown as RouteContext["params"]);
    const user = await UserController.updateUser(id, data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, user);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);