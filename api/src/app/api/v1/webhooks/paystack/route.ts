import { NextRequest, NextResponse } from "next/server";
import { parseAndVerifyWebhook, PaystackSignatureError } from "@/lib/paystack";
import { PaymentController } from "@/modules/payment/payment.controller";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  let event;
  try {
    event = parseAndVerifyWebhook(rawBody, signature, process.env.PAYSTACK_SECRET_KEY!);
  } catch (err) {
    if (err instanceof PaystackSignatureError) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
    return new NextResponse("Bad request", { status: 400 });
  }

  if (event.event === "charge.success") {
    try {
      await PaymentController.confirmPayment(event.data.reference);
    } catch (err) {
      console.error("Failed to confirm payment from webhook:", err);
      return new NextResponse("Processing error", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}