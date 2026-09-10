"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const VoteByCodeDialog = dynamic(
  () =>
    import("@/components/layout/vote-by-code-dialog").then(
      (mod) => mod.VoteByCodeDialog
    ),
  { ssr: false }
);

const navLinks = [
  { href: "/", label: "Elections" },
  { href: "/#how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [voteCodeOpen, setVoteCodeOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }

    const updateFromHash = () => {
      setActiveSection(window.location.hash === "#how-it-works" ? "how-it-works" : null);
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);

    const section = document.getElementById("how-it-works");
    if (!section) {
      return () => window.removeEventListener("hashchange", updateFromHash);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection("how-it-works");
        } else if (window.scrollY < section.offsetTop - 96) {
          setActiveSection(null);
        }
      },
      { rootMargin: "-20% 0px -65%", threshold: 0 }
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, [pathname]);

  const isHowItWorksActive = pathname === "/" && activeSection === "how-it-works";
  const isElectionsActive =
    (pathname === "/" || pathname.startsWith("/elections")) && !isHowItWorksActive;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-ink/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between md:h-18">
        <Link
          href="/"
          className="group focus-ring rounded-md"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="Ximacent"
            width={160}
            height={32}
            priority
            sizes="160px"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const active = link.href === "/"
              ? isElectionsActive
              : link.href.includes("#how-it-works")
                ? isHowItWorksActive
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors focus-ring",
                  active
                    ? "border-champagne/70 bg-champagne/5 font-semibold text-champagne"
                    : "text-stone hover:text-cream"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Button
            type="button"
            size="sm"
            className="ml-3"
            onClick={() => setVoteCodeOpen(true)}
            aria-haspopup="dialog"
          >
            Vote now
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="animate-fade-in overflow-hidden border-t border-border/50 md:hidden"
        >
          <nav className="container flex flex-col gap-1 py-4" aria-label="Mobile">
            {navLinks.map((link) => {
              const active = link.href === "/"
                ? isElectionsActive
                : link.href.includes("#how-it-works")
                  ? isHowItWorksActive
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-3 text-base font-medium transition-colors focus-ring",
                    active
                      ? "bg-champagne/10 text-champagne"
                      : "text-cream hover:bg-secondary hover:text-champagne"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button
              type="button"
              className="mt-2 min-h-11 w-full"
              onClick={() => {
                setOpen(false);
                setVoteCodeOpen(true);
              }}
              aria-haspopup="dialog"
            >
              Vote now
            </Button>
          </nav>
        </div>
      )}

      {voteCodeOpen && (
        <VoteByCodeDialog open={voteCodeOpen} onOpenChange={setVoteCodeOpen} />
      )}
    </header>
  );
}
