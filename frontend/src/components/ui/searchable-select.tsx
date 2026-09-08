"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  disabled,
  className,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  function choose(nextValue?: string) {
    onValueChange(nextValue);
    setSearch("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full sm:w-[240px]", className)}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-secondary/50 px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors hover:border-champagne/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn("line-clamp-1", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border border-border bg-card text-foreground shadow-elevated">
          <div className="border-b border-border/60 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded border border-input bg-secondary/40 pl-8 pr-2 text-xs outline-none focus:border-champagne/60"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm text-stone hover:bg-secondary hover:text-cream"
              onClick={() => choose()}
            >
              {!selected && <Check className="mr-2 h-3.5 w-3.5 text-champagne" />}
              {selected && <span className="mr-2 h-3.5 w-3.5" />}
              {placeholder}
            </button>
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-stone">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-secondary hover:text-cream"
                  onClick={() => choose(option.value)}
                >
                  {selected?.value === option.value ? (
                    <Check className="mr-2 h-3.5 w-3.5 text-champagne" />
                  ) : (
                    <span className="mr-2 h-3.5 w-3.5" />
                  )}
                  <span className="line-clamp-1">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}