"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/api/types";

const ALL = "all";

export interface UserFiltersValue {
  search: string;
  role: UserRole | undefined;
  isVerified: boolean | undefined;
}

export function UserFilters({
  value,
  onChange,
  hasActiveFilters,
  onReset,
}: {
  value: UserFiltersValue;
  onChange: (next: UserFiltersValue) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  function set<K extends keyof UserFiltersValue>(key: K, next: UserFiltersValue[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border/50 p-4 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 sm:min-w-[280px] sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
          aria-label="Search users by name or email"
        />
      </div>

      <Select
        value={value.role ?? ALL}
        onValueChange={(v) => set("role", v === ALL ? undefined : (v as UserRole))}
      >
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="voter">Voter</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.isVerified === undefined ? ALL : value.isVerified ? "yes" : "no"}
        onValueChange={(v) => set("isVerified", v === ALL ? undefined : v === "yes")}
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Verification" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All users</SelectItem>
          <SelectItem value="yes">Verified</SelectItem>
          <SelectItem value="no">Unverified</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset} className="sm:ml-auto">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
