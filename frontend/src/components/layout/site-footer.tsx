import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/50 bg-surface/40">
      <div className="container flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="font-display text-lg font-semibold text-cream">Ximacent</p>
          <p className="text-sm leading-relaxed text-stone">
            Premium online voting for pageants, awards, and live competitions.
            Secure payments. Instant confirmation. Results you can trust.
          </p>
        </div>

        <div className="grid gap-8 sm:gap-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-champagne">
              Explore
            </p>
            <ul className="space-y-2 text-sm text-stone">
              <li>
                <Link href="/" className="focus-ring rounded-sm transition hover:text-cream">
                  Active elections
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="focus-ring rounded-sm transition hover:text-cream">
                  How voting works
                </Link>
              </li>
              <li>
                <Link href="/online-voting" className="focus-ring rounded-sm transition hover:text-cream">
                  Online voting platform
                </Link>
              </li>
              <li>
                <Link href="/online-awards-voting" className="focus-ring rounded-sm transition hover:text-cream">
                  Awards voting
                </Link>
              </li>
              <li>
                <Link href="/online-election-voting" className="focus-ring rounded-sm transition hover:text-cream">
                  Election voting
                </Link>
              </li>
              <li>
                <Link href="/voting-platform-ghana" className="focus-ring rounded-sm transition hover:text-cream">
                  Voting platform Ghana
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="container flex flex-col gap-2 py-5 text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Ximacent. All rights reserved.</p>
          <p>Powered by secure checkout</p>
        </div>
      </div>
    </footer>
  );
}
