"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, LogOut, UserCircle2, UserRound } from "lucide-react";
import { ChangePasswordDialog } from "./change-password-dialog";
import { ProfileDialog } from "./profile-dialog";
import { useAuth } from "./auth-provider";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open]);

  if (!user) return null;

  const itemClass = "focus-ring flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-stone transition hover:bg-secondary hover:text-cream";
  const actionTrigger = <button type="button" className={itemClass} onClick={() => { setOpen(false); setPasswordOpen(true); }}><KeyRound className="h-4 w-4" />Change password</button>;

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Open account menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={compact ? "focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-secondary/40 text-cream transition hover:border-champagne/40 hover:text-champagne" : "focus-ring flex items-center gap-2.5 rounded-md border border-border/60 bg-secondary/30 px-3 py-2 text-left transition hover:border-champagne/40"}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-champagne/15 text-[11px] font-semibold text-champagne">{initials(user.firstName, user.lastName)}</span>
          {!compact && <span className="hidden min-w-0 sm:block"><span className="block max-w-32 truncate text-sm text-cream">{user.firstName} {user.lastName}</span><span className="block max-w-32 truncate text-[11px] text-stone">{user.email}</span></span>}
          <UserCircle2 className={compact ? "h-4 w-4" : "hidden h-4 w-4 text-stone sm:block"} />
        </button>
        {open && <div role="menu" aria-label="Account menu" className={`${compact ? "absolute bottom-full right-0 z-50 mb-2" : "absolute right-0 top-full z-50 mt-2"} w-56 rounded-md border border-border bg-card p-1.5 shadow-elevated`}><button type="button" role="menuitem" className={itemClass} onClick={() => { setOpen(false); setProfileOpen(true); }}><UserRound className="h-4 w-4" />My profile</button><ChangePasswordDialog trigger={actionTrigger} open={passwordOpen} onOpenChange={setPasswordOpen} /><button type="button" role="menuitem" className={`${itemClass} text-rose-soft hover:text-rose-soft`} onClick={() => { setOpen(false); logout(); }}><LogOut className="h-4 w-4" />Log out</button></div>}
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
