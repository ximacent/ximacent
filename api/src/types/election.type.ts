import type { ElectionStatus } from "@/database/entities/Election";

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
};