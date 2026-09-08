// src/utils/generateRef.ts

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates a unique, sortable reference string.
 * Format: {prefix}{14-char timestamp}{N-char random}
 *
 * Example: PAY_202504071523002X8R3K1A
 */
export function generateTransactionRef(prefix = "", randomLength = 10): string {
  const timePart = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  let randomPart = "";
  for (let i = 0; i < randomLength; i++) {
    randomPart += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return `${prefix}${timePart}${randomPart}`;
}