import { apiClient } from "./client";
import type { CreatePaymentResponse, PaymentStatusResponse } from "./types";

export interface CreatePaymentBody {
  nomineeId: string;
  quantity: number;
  /** Optional — never required in the UI. */
  voterEmail?: string;
  /** Optional — never required in the UI. */
  voterPhone?: string;
}

/** Public — amount is computed server-side; never send amount. */
export function createPayment(body: CreatePaymentBody) {
  return apiClient<CreatePaymentResponse>("/api/v1/payments", {
    method: "POST",
    body,
    public: true,
  });
}

export function getPaymentStatus(reference: string) {
  return apiClient<PaymentStatusResponse>(
    `/api/v1/payments/${encodeURIComponent(reference)}`,
    { public: true }
  );
}

/** Manual confirm / fallback nudge — idempotent. */
export function confirmPayment(reference: string) {
  return apiClient<Pick<PaymentStatusResponse, "status" | "reference">>(
    `/api/v1/payments/${encodeURIComponent(reference)}`,
    {
      method: "POST",
      public: true,
    }
  );
}
