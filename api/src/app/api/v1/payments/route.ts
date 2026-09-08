// app/api/v1/payments/route.ts
import { NextRequest } from "next/server";
import { PaymentController } from "@/modules/payment/payment.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { InitiatePaymentDTO } from "@/types/payment.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";
import { getClientIp } from "@/lib/rateLimit/getClientIp";

// Loose backstop against scripted hammering from a single source.
// Deliberately no per-nominee cap — a popular nominee getting many
// legitimate votes from many different people is the intended outcome,
// not abuse, and must never be throttled.
const IP_LIMIT = 60;
const IP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, resetAt } = checkRateLimit(`payments:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
      throw new CustomAppError(
        `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`,
        429,
        ErrorCodes.VALIDATION_FAILED.code,
        ErrorCodes.VALIDATION_FAILED.label,
        "rate_limited"
      );
    }

    const data: InitiatePaymentDTO = await req.json();
    const result = await PaymentController.initiatePayment(data);
    return customResponse(SuccessCodes.RECORD_CREATED.code, SuccessCodes.RECORD_CREATED.message, 201, result);
  } catch (error) {
    return handleError(error);
  }
}