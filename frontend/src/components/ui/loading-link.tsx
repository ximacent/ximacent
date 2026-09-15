"use client";

import Link, { type LinkProps } from "next/link";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LoadingLinkProps = LinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

export function LoadingLink({ className, children, onClick, ...props }: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isLoading) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      typeof props.href === "string" &&
      (() => {
        const destination = new URL(props.href, window.location.href);
        return destination.pathname !== pathname || destination.search !== window.location.search;
      })()
    ) {
      setIsLoading(true);
    }
  }

  return (
    <Link
      {...props}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      className={cn("relative", isLoading && "cursor-wait", className)}
      onClick={handleClick}
    >
      {children}
      {isLoading && (
        <Loader2
          className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 animate-spin rounded-full bg-ink/80 p-0.5 text-champagne"
          aria-hidden="true"
        />
      )}
      {isLoading && <span className="sr-only">Loading</span>}
    </Link>
  );
}