"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ElectionStatus, UserSummary } from "@/lib/api/types";

export function ElectionFilters({
  title,
  onTitleChange,
  status,
  onStatusChange,
  createdById,
  onCreatedByChange,
  creators,
  hasActiveFilters,
  onReset,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  status: ElectionStatus | undefined;
  onStatusChange: (value: ElectionStatus | undefined) => void;
  createdById: string | undefined;
  onCreatedByChange: (value: string | undefined) => void;
  creators: UserSummary[];
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 sm:min-w-[220px] sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Search by title…"
          className="pl-9"
          aria-label="Search elections by title"
        />
      </div>

      <SearchableSelect
        value={status}
        onValueChange={(value) => onStatusChange(value as ElectionStatus | undefined)}
        placeholder="All statuses"
        searchPlaceholder="Search statuses..."
        options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "closed", label: "Closed" }]}
        aria-label="Filter elections by status"
      />

      {creators.length > 0 && (
        <SearchableSelect
          value={createdById}
          onValueChange={onCreatedByChange}
          placeholder="Everyone"
          searchPlaceholder="Search creators..."
          options={creators.map((creator) => ({ value: creator.id, label: `${creator.firstName} ${creator.lastName}` }))}
          aria-label="Filter elections by creator"
        />
      )}

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset} className="sm:ml-auto">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
