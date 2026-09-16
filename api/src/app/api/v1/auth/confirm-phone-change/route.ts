// POST /api/v1/auth/confirm-phone-change — authenticated.
// Body: { otp }
// On success, phone/phoneVerified update atomically — this is the only
// moment the number actually changes.

import { AuthController } from "@/modules/auth/auth.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

const postHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const { allowed, resetAt } = checkRateLimit(`auth:confirm-phone-change:user:${req.user.sub}`, LIMIT, WINDOW_MS);
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
    const result = await AuthController.confirmPhoneChange(req.user.sub, data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, result);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = withAuth(postHandler);
