import type { UpdateElectionDTO } from "@/types/election.type";

// TypeORM's repo.merge() copies every property present on the object it's
// given — it has no concept of "this DTO type only has these fields" at
// runtime, since TS types are compile-time only. Without this allow-list,
// a client could PATCH /elections/:id with { status: "active", createdBy:
// "<other-user-id>" } in the body and have those apply directly, bypassing
// both the status state machine (section 13/14) and election ownership
// (section 15) entirely. Only these fields may ever reach repo.merge.
export class ElectionSanitizer {
  private static readonly UPDATABLE_FIELDS = [
    "title",
    "description",
    "startDate",
    "endDate",
    "pricePerVote",
  ] as const;

  static update(data: unknown): UpdateElectionDTO {
    const sanitized: Record<string, unknown> = {};
    if (!data || typeof data !== "object") return sanitized as UpdateElectionDTO;

    for (const key of this.UPDATABLE_FIELDS) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) sanitized[key] = value;
    }

    return sanitized as UpdateElectionDTO;
  }
}
