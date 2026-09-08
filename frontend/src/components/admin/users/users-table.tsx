"use client";

import { Trash2 } from "lucide-react";
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
import { UserRoleBadge } from "./user-role-badge";
import { formatDate } from "@/lib/utils";
import type { UserSummary } from "@/lib/api/types";

/** Shared with the loading-skeleton table so column widths never shift between states. */
export function UsersTableHeader({
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
            aria-label="Select all users on this page"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={onToggleAll}
          />
        </TableHead>
        <TableHead>Name</TableHead>
        <TableHead className="hidden sm:table-cell">Email</TableHead>
        <TableHead className="hidden md:table-cell">Phone</TableHead>
        <TableHead>Role</TableHead>
        <TableHead className="hidden lg:table-cell">Verified</TableHead>
        <TableHead className="hidden xl:table-cell">Joined</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function UsersTable({
  users,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onDeleteOne,
  /** The signed-in admin's own id — their row can't be selected or deleted
   * from here, so an admin can never lock themselves out. */
  currentUserId,
}: {
  users: UserSummary[];
  selectedIds: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onDeleteOne: (user: UserSummary) => void;
  currentUserId?: string;
}) {
  const selectableUsers = users.filter((u) => u.id !== currentUserId);
  const allOnPageSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));
  const someOnPageSelected = selectableUsers.some((u) => selectedIds.has(u.id));

  return (
    <Table>
      <UsersTableHeader
        allSelected={allOnPageSelected}
        someSelected={someOnPageSelected}
        onToggleAll={onToggleAll}
      />
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id} data-state={selectedIds.has(user.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  aria-label={isSelf ? "This is you" : `Select ${user.firstName} ${user.lastName}`}
                  checked={selectedIds.has(user.id)}
                  disabled={isSelf}
                  onCheckedChange={(checked) => onToggleOne(user.id, checked)}
                />
              </TableCell>
              <TableCell>
                <span className="line-clamp-1 block max-w-[200px] font-medium text-cream">
                  {user.firstName} {user.lastName}
                  {isSelf && <span className="ml-1.5 text-xs font-normal text-stone">(you)</span>}
                </span>
                <span className="block text-xs text-stone sm:hidden">{user.email}</span>
              </TableCell>
              <TableCell className="hidden text-stone sm:table-cell">{user.email}</TableCell>
              <TableCell className="hidden text-stone md:table-cell">{user.phone ?? "—"}</TableCell>
              <TableCell>
                <UserRoleBadge role={user.role} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className={user.isVerified ? "text-champagne" : "text-stone"}>
                  {user.isVerified ? "Verified" : "Unverified"}
                </span>
              </TableCell>
              <TableCell className="hidden text-stone xl:table-cell">
                {user.createdAt ? formatDate(user.createdAt) : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={isSelf ? "You can't delete your own account" : `Delete ${user.firstName} ${user.lastName}`}
                    disabled={isSelf}
                    title={isSelf ? "You can't delete your own account" : undefined}
                    className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
                    onClick={() => onDeleteOne(user)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
