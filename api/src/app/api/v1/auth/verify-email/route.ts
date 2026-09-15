// POST /api/v1/auth/verify-email
// Body: { email, otp }

import { NextRequest } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";
import { getClientIp } from "@/lib/rateLimit/getClientIp";

// Tight limit — this endpoint checks a 6-digit code, so it must be
// resistant to brute-forcing within the 10-minute OTP window.
const IP_LIMIT = 10;
const IP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, resetAt } = checkRateLimit(`auth:verify-email:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);

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
    const result = await AuthController.verifyEmailOTP(data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
}
