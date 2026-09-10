import type { ElectionStatus } from "@/lib/api/types";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function electionStateLabel(status: ElectionStatus) {
  if (status === "closed") return "Final Results";
  if (status === "draft") return "Coming Soon";
  return "Vote Now";
}

export function trimDescription(value: string, fallback: string) {
  const text = value.trim() || fallback;
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}...` : text;
}