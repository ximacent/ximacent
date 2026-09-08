"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Elections" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/admin/login", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-ink/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between md:h-18">
        <Link
          href="/"
          className="group flex items-center gap-2 focus-ring rounded-md"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-champagne/15 text-champagne ring-1 ring-champagne/30 transition group-hover:bg-champagne/25 group-hover:shadow-glow">
            <span className="font-display text-sm font-semibold">X</span>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-cream">
            Ximacent
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href.split("#")[0] || link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring",
                  active
                    ? "text-champagne"
                    : "text-stone hover:text-cream"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Button asChild size="sm" className="ml-3">
            <Link href="/">Vote now</Link>
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/50 md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-cream hover:bg-secondary hover:text-champagne"
                >
                  {link.label}
                </Link>
              ))}
              <Button asChild className="mt-2 w-full">
                <Link href="/" onClick={() => setOpen(false)}>
                  Vote now
                </Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
