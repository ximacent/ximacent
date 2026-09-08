// src/types.ts

/** Generic envelope every Paystack API response is wrapped in. */
export interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface InitializeTransactionInput {
  /** Amount in the SMALLEST currency unit (e.g. kobo for NGN, pesewas for GHS). Never pass "10.00" — pass 1000. */
  amount: number;
  email: string;
  currency?: string; // e.g. "NGN", "GHS", "USD"
  reference?: string; // if omitted, Paystack generates one
  callback_url?: string;
  channels?: PaystackChannel[];
  metadata?: Record<string, unknown>;
  subaccount?: string;
  split_code?: string;
}

export type PaystackChannel =
  | "card"
  | "bank"
  | "ussd"
  | "qr"
  | "mobile_money"
  | "bank_transfer"
  | "eft";

export interface InitializeTransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export type PaystackTransactionStatus =
  | "success"
  | "failed"
  | "abandoned"
  | "pending"
  | "reversed";

export interface VerifyTransactionData {
  id: number;
  domain: string;
  status: PaystackTransactionStatus;
  reference: string;
  amount: number; // smallest currency unit
  currency: string;
  paid_at: string | null;
  created_at: string;
  channel: string;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  fees: number | null;
  customer: {
    id: number;
    email: string;
    customer_code: string;
    phone: string | null;
  };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    bank: string;
    reusable: boolean;
    signature: string;
  };
  [key: string]: unknown; // Paystack's payload has many more fields than we type explicitly
}

/** Shape of the JSON body Paystack POSTs to your webhook URL. */
export interface PaystackWebhookEvent<T = VerifyTransactionData> {
  event: string; // e.g. "charge.success", "transfer.success"
  data: T;
}

export interface PaystackClientOptions {
  /** Your Paystack secret key (sk_test_... or sk_live_...). NEVER expose this client-side. */
  secretKey: string;
  /** Override the base API URL. Defaults to https://api.paystack.co */
  baseUrl?: string;
  /** Fetch timeout in ms. Defaults to 15000. */
  timeoutMs?: number;
}

/** Thrown for any non-2xx response or network-level failure talking to Paystack. */
export class PaystackApiError extends Error {
  readonly statusCode: number | null;
  readonly responseBody: unknown;

  constructor(message: string, statusCode: number | null, responseBody?: unknown) {
    super(message);
    this.name = "PaystackApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/** Thrown when a webhook payload's signature doesn't match — treat as a potential forgery, never trust the payload. */
export class PaystackSignatureError extends Error {
  constructor(message = "Invalid Paystack webhook signature") {
    super(message);
    this.name = "PaystackSignatureError";
  }
}
