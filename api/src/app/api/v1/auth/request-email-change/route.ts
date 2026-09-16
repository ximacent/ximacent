// POST /api/v1/auth/request-email-change — authenticated.
// Body: { newEmail }
// Sends an OTP to newEmail. Does NOT change email/emailVerified yet —
// only pendingEmail is set, until confirm-email-change succeeds.

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
    const { allowed, resetAt } = checkRateLimit(`auth:request-email-change:user:${req.user.sub}`, LIMIT, WINDOW_MS);
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
    const result = await AuthController.requestEmailChange(req.user.sub, data);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, "A verification code has been sent to the new email address.", 200, result);
  } catch (error) {
    return handleError(error);
  }
};

export const POST = withAuth(postHandler);