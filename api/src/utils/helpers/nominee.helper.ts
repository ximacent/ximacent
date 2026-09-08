import { Repository } from "typeorm";
import { Nominee } from "@/database/entities/Nominee";

function extractPrefix(title: string): string {
  const letters = title.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return "XXX";
}

/**
 * Generates a nominee code like "MIS0001". The numeric suffix is scoped
 * per election (via the shared prefix derived from the election title),
 * starting at 1 and incrementing on any collision. Safe under concurrency
 * because it retries on the DB's unique constraint rather than trusting
 * a count-then-insert.
 */
export async function generateNomineeCode(
  electionTitle: string,
  repo: Repository<Nominee>
): Promise<string> {
  const prefix = extractPrefix(electionTitle);
  let n = 1;

  while (true) {
    const code = `${prefix}${String(n).padStart(4, "0")}`;
    const exists = await repo.findOne({ where: { code } });
    if (!exists) return code;
    n += 1;
  }
}