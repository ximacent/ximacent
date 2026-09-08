// src/transactions.ts
import { PaystackClient } from "./client";
import {
  InitializeTransactionData,
  InitializeTransactionInput,
  PaystackApiError,
  PaystackResponse,
  VerifyTransactionData,
} from "./types";

/**
 * Starts a new transaction and returns the authorization_url to redirect
 * the payer to, plus the reference you should persist (e.g. on your Payment row)
 * BEFORE redirecting, so you can reconcile it later even if the user never returns.
 */
export async function initializeTransaction(
  client: PaystackClient,
  input: InitializeTransactionInput
): Promise<InitializeTransactionData> {
  if (!input.amount || input.amount <= 0) {
    throw new Error("initializeTransaction: amount must be a positive integer in the smallest currency unit");
  }
  if (!input.email) {
    throw new Error("initializeTransaction: email is required");
  }

  const res = await client.post<InitializeTransactionData>("/transaction/initialize", input);
  return res.data;
}

/**
 * Verifies a transaction by reference directly against Paystack's servers.
 * This is the SOURCE OF TRUTH for whether a payment succeeded — always call this
 * (never trust amount/status from a webhook body or from the frontend redirect alone)
 * before crediting anything.
 */
export async function verifyTransaction(
  client: PaystackClient,
  reference: string
): Promise<VerifyTransactionData> {
  if (!reference) {
    throw new Error("verifyTransaction: reference is required");
  }

  const res = await client.get<VerifyTransactionData>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
  return res.data;
}

/**
 * Convenience guard: verifies a transaction AND checks it matches the amount/currency
 * you expected before you trust it. This defends against a subtle but real bug —
 * confirming a reference is "successful" without checking it was paid for the
 * amount you actually charged (e.g. someone replays an old, unrelated reference
 * of a different, smaller amount to your webhook or callback).
 */
export async function verifyTransactionMatches(
  client: PaystackClient,
  reference: string,
  expected: { amount: number; currency?: string }
): Promise<VerifyTransactionData> {
  const data = await verifyTransaction(client, reference);

  if (data.status !== "success") {
    throw new PaystackApiError(
      `Transaction ${reference} is not successful (status: ${data.status})`,
      null,
      data
    );
  }

  if (data.amount !== expected.amount) {
    throw new PaystackApiError(
      `Transaction ${reference} amount mismatch: expected ${expected.amount}, got ${data.amount}`,
      null,
      data
    );
  }

  if (expected.currency && data.currency !== expected.currency) {
    throw new PaystackApiError(
      `Transaction ${reference} currency mismatch: expected ${expected.currency}, got ${data.currency}`,
      null,
      data
    );
  }

  return data;
}

export type { PaystackResponse };
