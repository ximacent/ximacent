import { NextRequest } from "next/server";
import { PublicController } from "@/modules/public/public.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { code } = await ctx.params;
    const result = await PublicController.getNomineeByCode(code);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
}