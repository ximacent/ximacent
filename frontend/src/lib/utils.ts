import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prepend API base URL to relative upload paths from the backend. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Short date for admin tables, e.g. "Sep 5, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Date + time for admin tables/detail views, e.g. "Sep 5, 2026, 2:15 PM". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** GHS currency display for a pricePerVote-style decimal string. */
export function formatMoney(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "GHS 0.00";
  return `GHS ${value.toFixed(2)}`;
}

/**
 * Converts an ISO datetime string from the API into the value shape a
 * `<input type="datetime-local">` needs ("YYYY-MM-DDTHH:mm"), expressed in
 * the browser's local time so the field shows what the admin would expect
 * to see, not the raw UTC instant.
 */
export function toDateTimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/**
 * Converts a `<input type="datetime-local">` value (local wall-clock time,
 * no timezone designator) into an ISO instant string for the API. Relies on
 * the JS Date parser treating a timezone-less date-time string as local time.
 */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
