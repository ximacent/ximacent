import {
  ClipboardCheck,
  Layers,
  LayoutDashboard,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface OrganizerNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const ORGANIZER_NAV_ITEMS: OrganizerNavItem[] = [
  { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/organizer/dashboard/elections", label: "Elections", icon: Trophy },
  { href: "/organizer/dashboard/categories", label: "Categories", icon: Layers },
  { href: "/organizer/dashboard/nominees", label: "Nominees", icon: UserRound },
  { href: "/organizer/dashboard/profile", label: "Profile & verification", icon: ClipboardCheck },
];