// POST /api/v1/auth/request-password-reset — public.
// Body: { email }
// Always returns success regardless of whether the email exists.

import { NextRequest } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";
import { getClientIp } from "@/lib/rateLimit/getClientIp";

const IP_LIMIT = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, resetAt } = checkRateLimit(`auth:request-password-reset:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
      throw new CustomAppError(
        `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`,
        429,
        ErrorCodes.RATE_LIMIT_EXCEEDED.code,
        ErrorCodes.RATE_LIMIT_EXCEEDED.label,
        "rate_limited"
      );
    }

    const data = await req.json();
    await AuthController.requestPasswordReset(data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, "If an account exists for this email, a password reset code has been sent.", 200);
  } catch (error) {
    return handleError(error);
  }
}
