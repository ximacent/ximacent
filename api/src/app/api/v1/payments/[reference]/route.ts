import { NextRequest } from "next/server";
import { PaymentController } from "@/modules/payment/payment.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";

type RouteContext = { params: Promise<{ reference: string }> };

// Status check — safe to poll from the frontend after redirect back from Paystack
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { reference } = await ctx.params;
    const payment = await PaymentController.getPayment(reference);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, {
      status: payment.status,
      reference: payment.providerReference,
      amount: payment.amount,
      quantity: payment.quantity,
    });
  } catch (error) {
    return handleError(error);
  }
}

// Manual confirm fallback — safe to call even if webhook already processed it
// (confirmByReference is idempotent).
export async function POST(_req: NextRequest, ctx: RouteContext) {
  try {
    const { reference } = await ctx.params;
    const payment = await PaymentController.confirmPayment(reference);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, {
      status: payment.status,
      reference: payment.providerReference,
    });
  } catch (error) {
    return handleError(error);
  }
}