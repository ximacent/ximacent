import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/api/types";

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-champagne/15 text-champagne ring-1 ring-champagne/30",
  super_admin: "bg-rose/15 text-rose-soft ring-1 ring-rose/30",
  organizer: "bg-gold/15 text-gold-soft ring-1 ring-gold/30",
  voter: "bg-secondary text-stone ring-1 ring-border",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  super_admin: "Super admin",
  organizer: "Organizer",
  voter: "Voter",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        ROLE_STYLES[role]
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
