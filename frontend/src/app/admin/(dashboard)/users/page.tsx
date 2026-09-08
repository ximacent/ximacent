"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { useAuth } from "@/components/admin/auth-provider";
import { UserFilters, type UserFiltersValue } from "@/components/admin/users/user-filters";
import { UserFormDialog } from "@/components/admin/users/user-form-dialog";
import { UsersTable, UsersTableHeader } from "@/components/admin/users/users-table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { listUsers, deleteUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import type { UserSummary } from "@/lib/api/types";

type PendingDelete = { kind: "single"; user: UserSummary } | { kind: "bulk"; ids: string[] } | null;

const EMPTY_FILTERS: UserFiltersValue = {
  search: "",
  role: undefined,
  isVerified: undefined,
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filtersInput, setFiltersInput] = useState<UserFiltersValue>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const search = useDebouncedValue(filtersInput.search, 350);
  const { role, isVerified } = filtersInput;

  const hasActiveFilters = Boolean(
    search || role || isVerified !== undefined
  );

  function resetToFirstPage() {
    setPage(1);
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-users", { page, limit, search, role, isVerified }],
    queryFn: () =>
      listUsers({
        page,
        limit,
        search: search || undefined,
        role,
        isVerified,
      }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteUsers(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(ids.length > 1 ? `${ids.length} users deleted` : "User deleted");
      setPendingDelete(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete", { description: message });
    },
  });

  const users = useMemo(() => data?.users ?? [], [data]);

  function toggleOne(id: string, checked: boolean) {
    if (id === currentUser?.id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      users
        .filter((u) => u.id !== currentUser?.id)
        .forEach((u) => (checked ? next.add(u.id) : next.delete(u.id)));
      return next;
    });
  }

  function handleResetFilters() {
    setFiltersInput(EMPTY_FILTERS);
    resetToFirstPage();
  }

  return (
    <div className="p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne">
            Control panel
          </p>
          <h1 className="mt-2 font-display text-display-md text-cream">Users</h1>
          <p className="mt-2 text-stone">Everyone with access to this control panel.</p>
        </div>
        <Button onClick={() => setCreatingUser(true)}>
          <Plus className="h-4 w-4" />
          New user
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="surface-card mt-8 overflow-hidden"
      >
        <UserFilters
          value={filtersInput}
          onChange={(next) => {
            setFiltersInput(next);
            resetToFirstPage();
          }}
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
        />

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-champagne/5 px-4 py-2.5">
            <span className="text-sm text-cream">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
                onClick={() => setPendingDelete({ kind: "bulk", ids: Array.from(selectedIds) })}
              >
                Delete selected
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Table>
            <UsersTableHeader allSelected={false} someSelected={false} onToggleAll={() => {}} />
            <TableSkeletonRows rows={limit > 10 ? 8 : limit} columns={8} />
          </Table>
        ) : isError ? (
          <ErrorState
            description="We couldn't load users. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={hasActiveFilters ? "No users match your filters" : "No users yet"}
            description={
              hasActiveFilters
                ? "Try a different search term or clear your filters."
                : "Add another admin so more than one person can manage the control panel."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreatingUser(true)}>
                  <Plus className="h-4 w-4" />
                  New user
                </Button>
              )
            }
          />
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <UsersTable
              users={users}
              selectedIds={selectedIds}
              onToggleOne={toggleOne}
              onToggleAll={toggleAll}
              onDeleteOne={(user) => setPendingDelete({ kind: "single", user })}
              currentUserId={currentUser?.id}
            />
          </div>
        )}

        {data && data.pagination.total > 0 && (
          <PaginationControls
            pagination={data.pagination}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              resetToFirstPage();
            }}
            itemLabel="users"
          />
        )}
      </motion.div>

      <UserFormDialog open={creatingUser} onOpenChange={setCreatingUser} />

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        isPending={deleteMutation.isPending}
        title={
          pendingDelete === null
            ? ""
            : pendingDelete.kind === "bulk"
              ? `Delete ${pendingDelete.ids.length} users?`
              : `Delete "${pendingDelete.user.firstName} ${pendingDelete.user.lastName}"?`
        }
        description="This revokes their access to the control panel immediately."
        onConfirm={() => {
          if (!pendingDelete) return;
          const ids = pendingDelete.kind === "bulk" ? pendingDelete.ids : [pendingDelete.user.id];
          deleteMutation.mutate(ids);
        }}
      />
    </div>
  );
}
