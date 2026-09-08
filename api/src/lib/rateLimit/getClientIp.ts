// src/lib/rateLimit/getClientIp.ts
import { NextRequest } from "next/server";

/**
 * Best-effort client IP extraction. Behind a reverse proxy/load balancer
 * (Nginx, Vercel, Cloudflare), the real client IP is in x-forwarded-for,
 * not the raw socket address. Falls back to "unknown" rather than throwing —
 * a missing IP should degrade to a shared bucket, not crash the request.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; the first is the original client.
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}