"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Small secondary text shown right-aligned in the option row (e.g. an
   * election name next to a category), and also matched against search. */
  sublabel?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Options are still loading — shows a spinner and disables opening. */
  loading?: boolean;
  disabled?: boolean;
  /** Applied to the trigger button — use for width, e.g. "w-full sm:w-[220px]". */
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * A single-select searchable dropdown, styled to match `Select` exactly but
 * with a filter box baked in. Built without any new dependency (no Radix
 * Popover, no cmdk) — this codebase already prefers small hand-rolled
 * primitives over pulling in more packages (see Checkbox), and a combobox is
 * simple enough to do the same way: a trigger button, a click-outside-aware
 * absolute panel, and a filtered list with roving keyboard focus.
 */
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select…",
      searchPlaceholder = "Search…",
      emptyText = "No matches",
      loading = false,
      disabled = false,
      className,
      id,
      "aria-label": ariaLabel,
    },
    forwardedRef
  ) => {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [highlighted, setHighlighted] = React.useState(0);

    const rootRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement);

    const selected = options.find((o) => o.value === value);

    const filtered = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel?.toLowerCase().includes(q) ?? false)
      );
    }, [options, query]);

    // Close on outside click.
    React.useEffect(() => {
      if (!open) return;
      function handlePointerDown(e: MouseEvent) {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open]);

    // Reset search + focus the filter box, and land the highlight on the
    // current value, whenever the panel opens.
    React.useEffect(() => {
      if (!open) return;
      setQuery("");
      const currentIndex = options.findIndex((o) => o.value === value);
      setHighlighted(Math.max(0, currentIndex));
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
      setHighlighted(0);
    }, [query]);

    function commit(index: number) {
      const option = filtered[index];
      if (!option || option.disabled) return;
      onValueChange(option.value);
      setOpen(false);
      triggerRef.current?.focus();
    }

    function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        commit(highlighted);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    }

    const isDisabled = disabled || loading;

    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <button
          ref={triggerRef}
          type="button"
          id={id}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => !isDisabled && setOpen((o) => !o)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={cn("line-clamp-1 text-left", !selected && "text-muted-foreground")}>
            {loading ? "Loading…" : (selected?.label ?? placeholder)}
          </span>
          {loading ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin opacity-60" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-60" />
          )}
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full min-w-[240px] overflow-hidden rounded-md border border-border bg-card text-foreground shadow-elevated animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2">
              <Search className="h-3.5 w-3.5 flex-shrink-0 text-stone" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-64 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-stone">{emptyText}</li>
              ) : (
                filtered.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => commit(index)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                      index === highlighted && "bg-secondary text-champagne",
                      option.disabled && "pointer-events-none opacity-50"
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {option.value === value && <Check className="h-3.5 w-3.5 text-champagne" />}
                    </span>
                    <span className="line-clamp-1 flex-1">{option.label}</span>
                    {option.sublabel && (
                      <span className="ml-2 flex-shrink-0 text-xs text-stone">{option.sublabel}</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
Combobox.displayName = "Combobox";
