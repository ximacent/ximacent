// Hubtel (and most SMS gateways) require E.164 format strictly — a local
// "0201234567" or a bare "201234567" will be silently rejected or
// mis-routed. Users may have typed their phone in any of these shapes at
// registration, so normalize before ever handing a number to a provider.
//
// Ghana-only for now (matches the rest of the organizer feature) — revisit
// if the platform expands beyond Ghana's +233 country code.
export function normalizeGhPhoneToE164(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+233")) return digitsOnly;
  if (digitsOnly.startsWith("233")) return `+${digitsOnly}`;
  if (digitsOnly.startsWith("0")) return `+233${digitsOnly.slice(1)}`;

  // Already looks like a bare 9-digit local number with no leading 0/233.
  if (/^\d{9}$/.test(digitsOnly)) return `+233${digitsOnly}`;

  // Fall through unchanged — better to let the provider reject an
  // unrecognized shape with a clear error than to guess wrong silently.
  return digitsOnly;
}

// mNotify's documented examples use LOCAL Ghana format ("0241234567"),
// not E.164 — the opposite of Hubtel. Keep both normalizers since
// switching SMS providers again later shouldn't require touching every
// call site, just picking the right one in that provider's file.
export function normalizeGhPhoneToLocal(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+233")) return `0${digitsOnly.slice(4)}`;
  if (digitsOnly.startsWith("233")) return `0${digitsOnly.slice(3)}`;
  if (digitsOnly.startsWith("0")) return digitsOnly;

  // Bare 9-digit local number with no leading 0/233.
  if (/^\d{9}$/.test(digitsOnly)) return `0${digitsOnly}`;

  return digitsOnly;
}
