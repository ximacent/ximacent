"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Election } from "@/lib/api/types";

export function CategoryFilters({
  name,
  onNameChange,
  electionId,
  onElectionChange,
  elections,
  hasActiveFilters,
  onReset,
}: {
  name: string;
  onNameChange: (value: string) => void;
  electionId: string | undefined;
  onElectionChange: (value: string | undefined) => void;
  elections: Election[];
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 sm:min-w-[220px] sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Search by name…"
          className="pl-9"
          aria-label="Search categories by name"
        />
      </div>

      <SearchableSelect
        value={electionId}
        onValueChange={onElectionChange}
        placeholder="All elections"
        searchPlaceholder="Search elections..."
        options={elections.map((election) => ({ value: election.id, label: election.title }))}
        aria-label="Filter categories by election"
      />

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset} className="sm:ml-auto">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
