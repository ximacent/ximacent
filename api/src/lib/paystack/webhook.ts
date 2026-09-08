// src/webhook.ts
import crypto from "crypto";
import { PaystackSignatureError, PaystackWebhookEvent, VerifyTransactionData } from "./types";

/**
 * Verifies that a webhook request actually came from Paystack.
 *
 * CRITICAL: you must pass the RAW, unparsed request body (the exact bytes Paystack sent),
 * not a re-serialized JSON.stringify(parsedBody). Re-serializing can change whitespace/key
 * order and will make a genuinely valid signature fail to match, or — worse in some frameworks —
 * you might be tempted to skip verification "because it doesn't match" which defeats the point.
 *
 * In Next.js (App Router) route handlers, get the raw body with `await req.text()`
 * BEFORE calling req.json() — you cannot read the body twice.
 *
 * @param rawBody   The exact raw request body string/Buffer as received.
 * @param signature The value of the `x-paystack-signature` request header.
 * @param secretKey Your Paystack SECRET key (same one used to call the API).
 * @throws PaystackSignatureError if the signature is missing or does not match.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null | undefined,
  secretKey: string
): void {
  if (!signature) {
    throw new PaystackSignatureError("Missing x-paystack-signature header");
  }
  if (!secretKey) {
    throw new Error("verifyWebhookSignature: secretKey is required");
  }

  const expected = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");

  // Lengths must match before timingSafeEqual (it throws on length mismatch),
  // and a length mismatch is itself just "invalid", not an error state.
  const isValid =
    expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    throw new PaystackSignatureError();
  }
}

/**
 * Verifies the signature AND parses the body into a typed event in one step.
 * Use this in your webhook route handler — it's the one function most integrations need.
 *
 * @example
 * // Next.js App Router route handler
 * export async function POST(req: NextRequest) {
 *   const rawBody = await req.text();
 *   const signature = req.headers.get("x-paystack-signature");
 *
 *   let event;
 *   try {
 *     event = parseAndVerifyWebhook(rawBody, signature, process.env.PAYSTACK_SECRET_KEY!);
 *   } catch (err) {
 *     // Do NOT process the payload. Log and return 400/401 — do not leak details to the caller.
 *     return new Response("Invalid signature", { status: 401 });
 *   }
 *
 *   if (event.event === "charge.success") {
 *     // Still re-verify via verifyTransaction() against the API before crediting anything —
 *     // the signature proves the request came from Paystack, it does not replace verification.
 *   }
 *
 *   return new Response("OK", { status: 200 });
 * }
 */
export function parseAndVerifyWebhook<T = VerifyTransactionData>(
  rawBody: string | Buffer,
  signature: string | null | undefined,
  secretKey: string
): PaystackWebhookEvent<T> {
  verifyWebhookSignature(rawBody, signature, secretKey);

  try {
    const parsed = JSON.parse(rawBody.toString());
    return parsed as PaystackWebhookEvent<T>;
  } catch {
    throw new Error("Paystack webhook body passed signature check but is not valid JSON");
  }
}
