import { NextRequest } from "next/server";
import { PublicController } from "@/modules/public/public.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const query = {
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    };
    const result = await PublicController.getUpcomingElections(query);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
}