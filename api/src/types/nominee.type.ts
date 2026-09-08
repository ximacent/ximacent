export type CreateNomineeDTO = {
    name: string;
    bio?: string;
    categoryId: string;
};

export type UpdateNomineeDTO = Partial<{
    name: string;
    bio: string;
    categoryId: string;
}>;

export type FilterNomineeDTO = {
    name?: string;
    categoryId?: string;
    code?: string;
};