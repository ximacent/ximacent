// POST /api/v1/auth/register
// Body: { firstName, lastName, email, password, phone, role? }
// role is clamped server-side to VOTER | ORGANIZER — ADMIN can never be
// requested through this endpoint. See AuthSanitizer.register.

import { NextRequest } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";
import { getClientIp } from "@/lib/rateLimit/getClientIp";

const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour — registration should be infrequent per IP

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, resetAt } = checkRateLimit(`auth:register:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
      throw new CustomAppError(
        `Too many registration attempts. Please try again in ${retryAfterSeconds} seconds.`,
        429,
        ErrorCodes.RATE_LIMIT_EXCEEDED.code,
        ErrorCodes.RATE_LIMIT_EXCEEDED.label,
        "rate_limited"
      );
    }

    const data = await req.json();
    const result = await AuthController.register(data, ip);
    return customResponse(SuccessCodes.RECORD_CREATED.code, SuccessCodes.RECORD_CREATED.message, 201, result);
  } catch (error) {
    return handleError(error);
  }
}
