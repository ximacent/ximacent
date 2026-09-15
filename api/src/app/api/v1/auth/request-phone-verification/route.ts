// POST /api/v1/auth/request-phone-verification — authenticated, no body.
// Sends/resends an OTP to the caller's own User.phone.

import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

const postHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const { allowed, resetAt } = checkRateLimit(`auth:request-phone-verification:user:${req.user.sub}`, LIMIT, WINDOW_MS);
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

    const result = await AuthController.requestPhoneVerification(req.user.sub);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, "If your account has a phone number, a verification code has been sent.", 200, result);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = withAuth(postHandler);
