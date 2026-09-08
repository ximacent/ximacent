"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Category, Election } from "@/lib/api/types";


export function NomineeFilters({
  name,
  onNameChange,
  categoryId,
  onCategoryChange,
  electionId,
  onElectionChange,
  elections,
  categories,
  hasActiveFilters,
  onReset,
}: {
  name: string;
  onNameChange: (value: string) => void;
  categoryId: string | undefined;
  onCategoryChange: (value: string | undefined) => void;
  electionId: string | undefined;
  onElectionChange: (value: string | undefined) => void;
  elections: Election[];
  categories: Category[];
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
          placeholder="Search by name or code (e.g. MIS0001)…"
          className="pl-9"
          aria-label="Search nominees by name or code"
        />
      </div>

      <SearchableSelect
        value={electionId}
        onValueChange={(value) => {
          onElectionChange(value);
          onCategoryChange(undefined);
        }}
        placeholder="All elections"
        searchPlaceholder="Search elections..."
        options={elections.map((election) => ({ value: election.id, label: election.title }))}
        aria-label="Filter nominees by election"
      />

      <SearchableSelect
        value={categoryId}
        onValueChange={onCategoryChange}
        placeholder={electionId ? "All categories" : "Choose an election first"}
        searchPlaceholder="Search categories..."
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        disabled={!electionId}
        aria-label="Filter nominees by category"
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
