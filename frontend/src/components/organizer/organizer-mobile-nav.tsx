"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/admin/auth-provider";
import { AccountMenu } from "@/components/admin/account-menu";
import { ORGANIZER_NAV_ITEMS } from "./organizer-nav-items";

export function OrganizerMobileNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); menuButtonRef.current?.focus(); return; }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return <>
    <header className="flex items-center justify-between border-b border-border/60 bg-surface px-4 py-3 md:hidden">
      <Image src="/logo.png" alt="Ximacent" width={120} height={24} priority />
      <div className="flex items-center gap-2"><button ref={menuButtonRef} type="button" onClick={() => setOpen(true)} aria-label="Open organizer menu" aria-expanded={open} className="focus-ring rounded-md p-2 text-cream"><Menu className="h-5 w-5" /></button></div>
    </header>
    <AnimatePresence>{open && <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm md:hidden" />
      <motion.div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Organizer navigation" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.25, ease: "easeOut" }} className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface md:hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4"><span className="font-display text-sm text-cream">Organizer menu</span><button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="focus-ring rounded-md p-1.5 text-stone hover:text-cream"><X className="h-5 w-5" /></button></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{ORGANIZER_NAV_ITEMS.map((item) => { const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-champagne/10 text-cream ring-1 ring-champagne/25" : "text-stone hover:bg-secondary/60 hover:text-cream")}><Icon className="h-4 w-4" />{item.label}</Link>; })}</nav>
        {user && <div className="border-t border-border/60 p-4"><div className="flex items-center gap-3 rounded-md border border-border/60 bg-secondary/30 px-3 py-2.5"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-champagne/15 text-xs font-semibold text-champagne">{`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm text-cream">{user.firstName} {user.lastName}</p><p className="truncate text-[11px] text-stone">{user.email}</p></div><AccountMenu compact /></div></div>}
      </motion.div>
    </>}</AnimatePresence>
  </>;
}