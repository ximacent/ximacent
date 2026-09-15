import type { SmsMessage, SmsProvider } from "../smsProvider";
import { normalizeGhPhoneToE164 } from "../normalizePhone";

const HUBTEL_SEND_URL = "https://smsc.hubtel.com/v1/messages/send";

interface HubtelSendResponse {
  rate: number;
  messageId: string;
  status: number;
  statusDescription: string | null;
  networkId: string;
}

// Uses Hubtel's "Regular Send" endpoint (POST, Basic Auth in the header)
// rather than "Quick Send" (GET, credentials as query params) — putting
// clientid/clientsecret in a URL means they end up in server access logs,
// proxy logs, and browser history if ever called client-side. Not worth
// the minor convenience for a real deployment.
export class HubtelSmsProvider implements SmsProvider {
  private authHeader: string;
  private senderId: string;

  constructor() {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    const senderId = process.env.HUBTEL_SENDER_ID;

    if (!clientId || !clientSecret || !senderId) {
      throw new Error(
        "Hubtel SMS provider requires HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET and HUBTEL_SENDER_ID to be set in the environment."
      );
    }

    // Hubtel's Sender ID is capped at 11 alphanumeric characters and must
    // be pre-approved by Hubtel — fail fast at startup rather than have
    // every send silently rejected by their API.
    if (!/^[a-zA-Z0-9]{1,11}$/.test(senderId)) {
      throw new Error(
        `HUBTEL_SENDER_ID "${senderId}" is invalid — Hubtel requires 11 alphanumeric characters or fewer, and the Sender ID must be pre-approved by Hubtel support.`
      );
    }

    this.authHeader = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    this.senderId = senderId;
  }

  async send(message: SmsMessage): Promise<void> {
    const to = normalizeGhPhoneToE164(message.to);

    const response = await fetch(HUBTEL_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader,
      },
      body: JSON.stringify({
        from: this.senderId,
        to,
        content: message.body,
      }),
    });

    const body = (await response.json().catch(() => null)) as HubtelSendResponse | null;

    // Hubtel returns 200 with a `status` field in the body rather than
    // using HTTP status codes to signal delivery-queue failures, so both
    // need checking. status === 0 means "accepted into the send queue" —
    // it does not mean "delivered" (that requires a separate status-query
    // call, which isn't needed for OTP delivery here).
    if (!response.ok || !body || body.status !== 0) {
      throw new Error(
        `Hubtel SMS send failed (HTTP ${response.status}): ${body?.statusDescription ?? "no response body"}`
      );
    }
  }
}
