import type { UserRole } from "@/database/entities/User";

// Who is performing a user-management action. Always derived from the
// JWT (req.user), never trusted from the request body.
export type UserActor = {
  id: string;
  role: UserRole;
};

// ── Create ───────────────────────────────────────────────────────
export type CreateUserDTO = {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    phone: string;
    role: UserRole;
};

// ── Update ───────────────────────────────────────────────────────
export type UpdateUserDTO = Partial<{
    firstName: string;
    lastName: string;
    phone: string;
}>;

// ── Filter (list/search) ────────────────────────────────────────
export type FilterUserDTO = {
    search?: string;
    phone?: string;
    role?: UserRole;
    isVerified?: boolean;
};