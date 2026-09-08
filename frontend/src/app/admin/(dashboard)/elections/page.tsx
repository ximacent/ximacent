"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { ElectionFilters } from "@/components/admin/elections/election-filters";
import { ElectionsTable, ElectionsTableHeader } from "@/components/admin/elections/elections-table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { listElections, deleteElections } from "@/lib/api/elections";
import { listUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/types";
import type { Election, ElectionStatus } from "@/lib/api/types";

type PendingDelete = { kind: "single"; election: Election } | { kind: "bulk"; ids: string[] } | null;

export default function AdminElectionsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [titleInput, setTitleInput] = useState("");
  const [status, setStatus] = useState<ElectionStatus | undefined>(undefined);
  const [createdById, setCreatedById] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const title = useDebouncedValue(titleInput, 350);
  const hasActiveFilters = Boolean(title || status || createdById);

  function resetToFirstPage() {
    setPage(1);
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-elections", { page, limit, title, status, createdById }],
    queryFn: () => listElections({ page, limit, title: title || undefined, status, createdById }),
    placeholderData: keepPreviousData,
  });

  // Populates the "Created by" filter. Kept quiet on failure — it's a nice-to-have,
  // not core to the page — so the whole screen never blocks on it.
  const { data: creatorsData } = useQuery({
    queryKey: ["admin-users-lite", "admin"],
    queryFn: () => listUsers({ role: "admin", limit: 100 }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteElections(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-elections"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(ids.length > 1 ? `${ids.length} elections deleted` : "Election deleted");
      setPendingDelete(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete", { description: message });
    },
  });

  const elections = useMemo(() => data?.elections ?? [], [data]);

  function toggleOne(id: string, checked: boolean) {
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
      elections.forEach((e) => (checked ? next.add(e.id) : next.delete(e.id)));
      return next;
    });
  }

  function handleResetFilters() {
    setTitleInput("");
    setStatus(undefined);
    setCreatedById(undefined);
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
          <h1 className="mt-2 font-display text-display-md text-cream">Elections</h1>
          <p className="mt-2 text-stone">Create, launch, and manage every election.</p>
        </div>
        <Button asChild>
          <Link href="/admin/elections/new">
            <Plus className="h-4 w-4" />
            New election
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="surface-card mt-8 overflow-hidden"
      >
        <ElectionFilters
          title={titleInput}
          onTitleChange={(v) => {
            setTitleInput(v);
            resetToFirstPage();
          }}
          status={status}
          onStatusChange={(v) => {
            setStatus(v);
            resetToFirstPage();
          }}
          createdById={createdById}
          onCreatedByChange={(v) => {
            setCreatedById(v);
            resetToFirstPage();
          }}
          creators={creatorsData?.users ?? []}
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
            <ElectionsTableHeader allSelected={false} someSelected={false} onToggleAll={() => {}} />
            <TableSkeletonRows rows={limit > 10 ? 8 : limit} columns={7} />
          </Table>
        ) : isError ? (
          <ErrorState
            description="We couldn't load elections. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : elections.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={hasActiveFilters ? "No elections match your filters" : "No elections yet"}
            description={
              hasActiveFilters
                ? "Try a different search term or clear your filters."
                : "Create your first election to start setting up categories and nominees."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/admin/elections/new">
                    <Plus className="h-4 w-4" />
                    Create election
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ElectionsTable
              elections={elections}
              selectedIds={selectedIds}
              onToggleOne={toggleOne}
              onToggleAll={toggleAll}
              onDeleteOne={(election) => setPendingDelete({ kind: "single", election })}
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
            itemLabel="elections"
          />
        )}
      </motion.div>

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        isPending={deleteMutation.isPending}
        title={
          pendingDelete === null
            ? ""
            : pendingDelete.kind === "bulk"
              ? `Delete ${pendingDelete.ids.length} elections?`
              : `Delete "${pendingDelete.election.title}"?`
        }
        description="This removes the election from every list. Any categories, nominees, and vote history stay on record but will no longer be publicly reachable."
        onConfirm={() => {
          if (!pendingDelete) return;
          const ids = pendingDelete.kind === "bulk" ? pendingDelete.ids : [pendingDelete.election.id];
          deleteMutation.mutate(ids);
        }}
      />
    </div>
  );
}
