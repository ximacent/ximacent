// ── Create ───────────────────────────────────────────────────────
export type CreateCategoryDTO = {
    name: string;
    description?: string;
    displayOrder?: number;
    electionId: string;
};

// ── Update ───────────────────────────────────────────────────────
export type UpdateCategoryDTO = Partial<{
    name: string;
    description: string;
    displayOrder: number;
}>;

// ── Filter (list/search) ────────────────────────────────────────
export type FilterCategoryDTO = {
    name?: string;
    electionId?: string;
};