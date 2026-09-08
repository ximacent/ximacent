// src/client.ts
import { PaystackApiError, PaystackClientOptions, PaystackResponse } from "./types";

const DEFAULT_BASE_URL = "https://api.paystack.co";
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Thin, dependency-free HTTP client for the Paystack REST API.
 * Uses global fetch (Node 18+ / any modern runtime) — no axios, no SDK lock-in.
 */
export class PaystackClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: PaystackClientOptions) {
    if (!options.secretKey) {
      throw new Error("PaystackClient: secretKey is required");
    }
    if (!options.secretKey.startsWith("sk_")) {
      // Not fatal (Paystack may issue other prefixes in some setups), but a very
      // common mistake is passing the PUBLIC key here by accident. Warn loudly.
      console.warn(
        "[paystack-kit] Warning: secretKey does not start with 'sk_'. " +
          "Make sure you passed the SECRET key, not the public key — the secret key must never be exposed client-side."
      );
    }

    this.secretKey = options.secretKey;
    this.baseUrl = options.baseUrl?.replace(/\/+$/, "") ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<PaystackResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      throw new PaystackApiError(
        isAbort
          ? `Paystack request to ${path} timed out after ${this.timeoutMs}ms`
          : `Network error calling Paystack (${path}): ${(err as Error).message}`,
        null
      );
    }
    clearTimeout(timeout);

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new PaystackApiError(
        `Paystack returned a non-JSON response (status ${res.status}) for ${path}`,
        res.status
      );
    }

    if (!res.ok) {
      const message =
        (json as { message?: string } | null)?.message ??
        `Paystack request to ${path} failed with status ${res.status}`;
      throw new PaystackApiError(message, res.status, json);
    }

    return json as PaystackResponse<T>;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }
}
