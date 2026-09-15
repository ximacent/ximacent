import { getSmsProvider } from "./getSmsProvider";
import { SmsSendError, type SmsMessage } from "./smsProvider";

const APP_NAME = process.env.APP_NAME || "Ximacent";
const MAX_RETRIES = Number(process.env.SMS_MAX_RETRIES) || 3;
const BASE_DELAY_MS = Number(process.env.SMS_BASE_DELAY_MS) || 1000;

/**
 * Single entry point for all outbound SMS. Retries transient failures
 * with exponential backoff (1s, 2s, 4s by default); a provider signaling
 * a non-retryable failure (bad credentials, unapproved sender ID,
 * rejected number) via SmsSendError stops immediately instead of wasting
 * retries on something that will fail identically every time. After all
 * retries are exhausted, the failure is logged and swallowed — same
 * reasoning as EmailService: a genuinely broken SMS gateway must never
 * fail or roll back the operation that triggered the send.
 */
export class SmsService {
  private static async sendWithRetry(message: SmsMessage): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await getSmsProvider().send(message);
        return;
      } catch (err) {
        lastError = err;
        const retryable = err instanceof SmsSendError ? err.retryable : true;

        console.warn(`SmsService: attempt ${attempt}/${MAX_RETRIES} failed for ${message.to}`, err);

        if (!retryable) break;

        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** (attempt - 1); // 1s, 2s, 4s
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    console.error(`SmsService: giving up sending to ${message.to} after retries`, lastError);
  }

  static async sendPhoneVerificationOTP(to: string, otp: string) {
    await this.sendWithRetry({
      to,
      body: `${APP_NAME}: your verification code is ${otp}. It expires in 10 minutes.`,
    });
  }
}
