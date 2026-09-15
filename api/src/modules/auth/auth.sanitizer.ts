import { UserRole } from "@/database/entities/User";
import type { RegisterDTO } from "@/types/auth.type";

// Public self-registration may only ever produce a VOTER or ORGANIZER
// account. ADMIN accounts are created only via the seed script
// (scripts/seed-admin.ts) or by an existing admin through the admin-only
// /users endpoint — never through this public route, regardless of what
// `role` value is sent in the request body.
const REGISTERABLE_ROLES: ReadonlySet<UserRole> = new Set([UserRole.VOTER, UserRole.ORGANIZER]);

export class AuthSanitizer {
  private static readonly REGISTERABLE_FIELDS = [
    "firstName",
    "lastName",
    "email",
    "password",
    "phone",
    "role",
  ] as const;

  static register(data: unknown): RegisterDTO {
    const sanitized: Record<string, unknown> = {};
    if (data && typeof data === "object") {
      for (const key of this.REGISTERABLE_FIELDS) {
        const value = (data as Record<string, unknown>)[key];
        if (value !== undefined) sanitized[key] = value;
      }
    }

    // Hard clamp: any role outside {VOTER, ORGANIZER} — including ADMIN,
    // garbage strings, or an omitted role — becomes VOTER. This can never
    // be bypassed by the client no matter what it sends.
    const requestedRole = sanitized.role;
    sanitized.role =
      typeof requestedRole === "string" && REGISTERABLE_ROLES.has(requestedRole as UserRole)
        ? (requestedRole as UserRole)
        : UserRole.VOTER;

    return sanitized as RegisterDTO;
  }
}
