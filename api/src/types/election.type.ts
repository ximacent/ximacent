import type { ElectionStatus } from "@/database/entities/Election";
import type { UserRole } from "@/database/entities/User";

// Who is performing an election mutation. Always derived from the JWT
// (req.user), never trusted from the request body — see withAuth.
export type ElectionActor = {
  id: string;
  role: UserRole;
};

// ── Create ───────────────────────────────────────────────────────
export type CreateElectionDTO = {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: ElectionStatus;
    pricePerVote: string;
};

// ── Update ───────────────────────────────────────────────────────
export type UpdateElectionDTO = Partial<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    pricePerVote: string;
}>;

// ── Filter (list/search) ────────────────────────────────────────
export type FilterElectionDTO = {
    title?: string;
    status?: ElectionStatus;
    createdById?: string;
};

export type UpdateElectionStatusDTO = {
    status: ElectionStatus;
    // Required by the validator when status === REJECTED, ignored otherwise.
    rejectionReason?: string;
};