import type { MetadataRoute } from "next";
import {
  getPublicElection,
  listPublicElections,
  listUpcomingElections,
  listPastElections,
} from "@/lib/api/elections";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
export const revalidate = 3600;

const staticPages = [
  "",
  "/online-voting",
  "/online-awards-voting",
  "/online-election-voting",
  "/paid-online-voting",
  "/voting-platform-ghana",
  "/how-it-works",
  "/security",
  "/about",
  "/contact",
  "/faq",
];

function absoluteUrl(path: string) {
  return `${siteUrl}${path}`;
}

const PAGE_SIZE = 100;

type ElectionSummary = { id: string; slug: string; status: string; updatedAt: string };
type ListResult = { elections: ElectionSummary[]; pagination: { totalPages: number } };
type ListFn = (params: { page: number; limit: number }) => Promise<ListResult>;

async function fetchAllElections(listFn: ListFn): Promise<ElectionSummary[]> {
  const first = await listFn({ page: 1, limit: PAGE_SIZE });
  const all = [...first.elections];
  const totalPages = first.pagination?.totalPages ?? 1;

  if (totalPages > 1) {
    const rest = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const pages = await Promise.all(rest.map((page) => listFn({ page, limit: PAGE_SIZE })));
    for (const p of pages) all.push(...p.elections);
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [active, upcoming, past] = await Promise.all([
      fetchAllElections(listPublicElections),
      fetchAllElections(listUpcomingElections),
      fetchAllElections(listPastElections),
    ]);

    const elections = [...active, ...upcoming, ...past].filter(
      (election, index, all) => all.findIndex((item) => item.id === election.id) === index
    );

    const details = await Promise.all(
      elections.map((election) => getPublicElection(election.slug).catch(() => null))
    );

    elections.forEach((election, i) => {
      const electionPath = `/elections/${encodeURIComponent(election.slug)}`;
      const changeFrequency =
        election.status === "active" ? "daily" : election.status === "draft" ? "weekly" : "monthly";
      const priority = election.status === "active" ? 0.9 : election.status === "draft" ? 0.6 : 0.7;

      entries.push({
        url: absoluteUrl(electionPath),
        lastModified: election.updatedAt,
        changeFrequency,
        priority,
      });

      entries.push({
        url: absoluteUrl(`${electionPath}/results`),
        lastModified: election.updatedAt,
        changeFrequency: election.status === "active" ? "hourly" : "monthly",
        priority: 0.8,
      });

      const detail = details[i];
      if (!detail) return;

      for (const category of detail.categories) {
        entries.push({
          url: absoluteUrl(`${electionPath}/categories/${category.id}`),
          lastModified: election.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
        for (const nominee of category.nominees) {
          entries.push({
            url: absoluteUrl(`/nominees/${encodeURIComponent(nominee.code)}`),
            lastModified: election.updatedAt,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    });
  } catch {
    // Keep static pages available if the API is temporarily unavailable.
  }

  return entries;
}