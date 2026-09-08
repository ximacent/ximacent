// src/idempotency.ts

/**
 * Storage-agnostic contract for making payment confirmation idempotent.
 *
 * Paystack WILL occasionally deliver the same webhook twice (retries on timeout,
 * network blips, etc.), and you'll often ALSO have a manual "verify" fallback
 * (e.g. polling from the frontend, or a cron reconciliation job) that can race
 * against the webhook. Both paths must be safe to run concurrently for the same
 * reference without double-crediting anything (double votes, double payouts, etc.).
 *
 * Implement this against your own DB (e.g. a unique constraint on `reference` in
 * your Payment table, with a `status` column and row locking). This interface just
 * defines the shape so `processPaymentOnce` below can be reused across projects
 * regardless of what DB/ORM you're on.
 */
export interface PaymentIdempotencyStore {
  /**
   * Atomically claims a reference for processing. Must return `false` if the
   * reference is already claimed/processed (e.g. status is already "success"),
   * and `true` if this call successfully claimed it. Implementations should do
   * this with a DB-level atomic operation (row lock / unique constraint / conditional
   * update), not a plain "check then write" from application code, or two concurrent
   * calls can both pass the check.
   */
  tryClaim(reference: string): Promise<boolean>;

  /** Marks the reference as fully processed (called after your business logic succeeds). */
  markProcessed(reference: string): Promise<void>;

  /** Releases a claim without marking it processed (called if your business logic throws), so a retry can succeed later. */
  releaseClaim(reference: string): Promise<void>;
}

/**
 * Runs `handler` for a given payment reference at most once, using the provided
 * store to coordinate between concurrent callers (webhook vs. manual verify, or
 * duplicate webhook deliveries).
 *
 * @returns `{ processed: true }` if handler ran and succeeded this call,
 *          `{ processed: false }` if the reference was already claimed/processed
 *          by another call and handler was skipped.
 */
export async function processPaymentOnce(
  store: PaymentIdempotencyStore,
  reference: string,
  handler: () => Promise<void>
): Promise<{ processed: boolean }> {
  const claimed = await store.tryClaim(reference);
  if (!claimed) {
    return { processed: false };
  }

  try {
    await handler();
    await store.markProcessed(reference);
    return { processed: true };
  } catch (err) {
    await store.releaseClaim(reference);
    throw err;
  }
}
