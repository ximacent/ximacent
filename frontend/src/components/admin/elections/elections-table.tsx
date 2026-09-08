"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ElectionStatusActions } from "./election-status-actions";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Election } from "@/lib/api/types";

/** Shared with the loading-skeleton table so column widths never shift between states. */
export function ElectionsTableHeader({
  allSelected,
  someSelected,
  onToggleAll,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (checked: boolean) => void;
}) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-10">
          <Checkbox
            aria-label="Select all elections on this page"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={onToggleAll}
          />
        </TableHead>
        <TableHead>Election</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="hidden md:table-cell">Price / vote</TableHead>
        <TableHead className="hidden lg:table-cell">Dates</TableHead>
        <TableHead className="hidden xl:table-cell">Created by</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function ElectionsTable({
  elections,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onDeleteOne,
}: {
  elections: Election[];
  selectedIds: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onDeleteOne: (election: Election) => void;
}) {
  const allOnPageSelected =
    elections.length > 0 && elections.every((e) => selectedIds.has(e.id));
  const someOnPageSelected = elections.some((e) => selectedIds.has(e.id));

  return (
    <Table>
      <ElectionsTableHeader
        allSelected={allOnPageSelected}
        someSelected={someOnPageSelected}
        onToggleAll={onToggleAll}
      />
      <TableBody>
        {elections.map((election) => (
          <TableRow key={election.id} data-state={selectedIds.has(election.id) ? "selected" : undefined}>
            <TableCell>
              <Checkbox
                aria-label={`Select ${election.title}`}
                checked={selectedIds.has(election.id)}
                onCheckedChange={(checked) => onToggleOne(election.id, checked)}
              />
            </TableCell>
            <TableCell>
              <Link
                href={`/admin/elections/${election.id}/edit`}
                className="focus-ring block max-w-[240px] rounded-sm font-medium text-cream hover:text-champagne"
              >
                <span className="line-clamp-1">{election.title}</span>
              </Link>
              <span className="text-xs text-stone">/{election.slug}</span>
            </TableCell>
            <TableCell>
              <AdminStatusBadge status={election.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell text-stone">
              {formatMoney(election.pricePerVote)}
            </TableCell>
            <TableCell className="hidden lg:table-cell whitespace-nowrap text-stone">
              {formatDate(election.startDate)} – {formatDate(election.endDate)}
            </TableCell>
            <TableCell className="hidden xl:table-cell text-stone">
              {election.createdBy ? `${election.createdBy.firstName} ${election.createdBy.lastName}` : "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <ElectionStatusActions election={election} />
                <Button variant="outline" size="icon" asChild aria-label={`Edit ${election.title}`}>
                  <Link href={`/admin/elections/${election.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Delete ${election.title}`}
                  className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
                  onClick={() => onDeleteOne(election)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
