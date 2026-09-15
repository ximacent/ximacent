import type { SmsMessage, SmsProvider } from "../smsProvider";
import { SmsSendError } from "../smsProvider";
import { normalizeGhPhoneToLocal } from "../normalizePhone";
import { checkLowCreditAlert } from "../lowCreditAlert";

const DEFAULT_MNOTIFY_URL = "https://api.mnotify.com/api/sms/quick";

interface MnotifyResponse {
  status: string; // "success" on success
  code: string; // "2000" on success
  message: string;
  summary?: {
    _id: string;
    type: string;
    total_sent: number;
    contacts: number;
    total_rejected: number;
    credit_used: number;
    credit_left: number;
  };
}

export class MnotifySmsProvider implements SmsProvider {
  private apiKey: string;
  private senderId: string;
  private sendUrl: string;
  private timeoutMs: number;

  constructor() {
    const apiKey = process.env.MNOTIFY_API_KEY;
    const senderId = process.env.MNOTIFY_SENDER;

    if (!apiKey || !senderId) {
      throw new Error("mNotify SMS provider requires MNOTIFY_API_KEY and MNOTIFY_SENDER to be set in the environment.");
    }

    this.apiKey = apiKey;
    this.senderId = senderId;
    this.sendUrl = process.env.MNOTIFY_URL || DEFAULT_MNOTIFY_URL;
    this.timeoutMs = Number(process.env.SMS_TIMEOUT_MS) || 30000;
  }

  async send(message: SmsMessage): Promise<void> {
    const recipient = normalizeGhPhoneToLocal(message.to);
    const url = `${this.sendUrl}?key=${encodeURIComponent(this.apiKey)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: [recipient],
          sender: this.senderId,
          message: message.body,
          is_schedule: false,
          schedule_date: "",
          // Every send through this provider is an OTP — per mNotify's
          // docs, this field must only be present for genuinely OTP
          // traffic (it changes billing), so it's hardcoded true here
          // rather than exposed as an option. If this provider is ever
          // reused for non-OTP SMS, that's a reason to add a `purpose`
          // param, not to drop this.
          sms_type: "otp",
        }),
        signal: controller.signal,
      });
    } catch (err) {
      // Network failure, DNS error, or our own AbortController timeout —
      // all transient, worth retrying.
      const reason = err instanceof Error ? err.message : "unknown network error";
      throw new SmsSendError(`mNotify SMS request failed: ${reason}`, true);
    } finally {
      clearTimeout(timeout);
    }

    const body = (await response.json().catch(() => null)) as MnotifyResponse | null;

    // HTTP-level failure. 429/5xx are transient (rate limit, their server
    // having a bad moment); other 4xx (bad key, malformed request) will
    // fail identically on every retry.
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new SmsSendError(
        `mNotify SMS send failed (HTTP ${response.status}): ${body?.message ?? "no response body"}`,
        retryable
      );
    }

    // HTTP 200 does not guarantee the SMS was actually accepted — mNotify
    // signals real success via status/code in the body.
    if (!body || body.status !== "success" || body.code !== "2000") {
      throw new SmsSendError(`mNotify SMS rejected: ${body?.message ?? "unknown error"}`, false);
    }

    if (body.summary && body.summary.total_rejected > 0) {
      throw new SmsSendError(
        `mNotify rejected the recipient (likely an invalid/blacklisted number): ${recipient}`,
        false
      );
    }

    // Fire-and-forget — never let a low-credit check delay or fail an
    // otherwise-successful send. Internally deduped so this doesn't spam
    // admins on every single OTP once the balance is low.
    if (body.summary) {
      void checkLowCreditAlert(body.summary.credit_left);
    }
  }
}
