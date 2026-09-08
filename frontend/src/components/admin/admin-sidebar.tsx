"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { ADMIN_NAV_ITEMS } from "./admin-nav-items";

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-border/60 bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-champagne/15">
          <Trophy className="h-4 w-4 text-champagne" />
        </div>
        <div>
          <p className="font-display text-sm leading-tight text-cream">Ximacent</p>
          <p className="text-[11px] leading-tight text-stone">Control panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "text-cream"
                  : "text-stone hover:bg-secondary/60 hover:text-cream"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-active"
                  className="absolute inset-0 rounded-md bg-champagne/10 ring-1 ring-champagne/25"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone transition hover:bg-secondary/60 hover:text-cream"
        >
          <ExternalLink className="h-4 w-4" />
          View public site
        </a>

        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-champagne/15 text-xs font-semibold text-champagne">
              {initials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-cream">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[11px] text-stone">{user.email}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              className="focus-ring flex-shrink-0 rounded-md p-1.5 text-stone transition hover:bg-secondary hover:text-rose"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
