import {
  LayoutDashboard,
  Trophy,
  Layers,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/elections", label: "Elections", icon: Trophy },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/nominees", label: "Nominees", icon: UserRound },
  { href: "/admin/users", label: "Users", icon: Users },
];
