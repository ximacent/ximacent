// src/currency.ts

/**
 * Paystack amounts are always in the SMALLEST currency unit (kobo, pesewas, cents).
 * The single most common integration bug is sending "500" meaning 500 NGN when
 * Paystack reads it as 5 NGN (500 kobo). These helpers make the conversion explicit
 * at the call site instead of a silent magic-number multiply scattered everywhere.
 */

/** Converts a "human" amount (e.g. 500.00 GHS) to the integer subunit Paystack expects (50000 pesewas). */
export function toSubunit(mainUnitAmount: number): number {
  if (!Number.isFinite(mainUnitAmount) || mainUnitAmount < 0) {
    throw new Error(`toSubunit: invalid amount "${mainUnitAmount}"`);
  }
  // Round to avoid floating point artifacts (e.g. 19.99 * 100 = 1998.9999999999998)
  return Math.round(mainUnitAmount * 100);
}

/** Converts a Paystack subunit amount (e.g. 50000 pesewas) back to the human-readable main unit (500.00 GHS). */
export function fromSubunit(subunitAmount: number): number {
  if (!Number.isFinite(subunitAmount) || subunitAmount < 0) {
    throw new Error(`fromSubunit: invalid amount "${subunitAmount}"`);
  }
  return Math.round(subunitAmount) / 100;
}
