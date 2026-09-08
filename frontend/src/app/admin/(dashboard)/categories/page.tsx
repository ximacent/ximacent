"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { CategoryFilters } from "@/components/admin/categories/category-filters";
import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import {
  CategoriesTable,
  CategoriesTableHeader,
} from "@/components/admin/categories/categories-table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { listCategories, deleteCategories } from "@/lib/api/categories";
import { listElections } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import type { Category } from "@/lib/api/types";

type PendingDelete = { kind: "single"; category: Category } | { kind: "bulk"; ids: string[] } | null;
type FormState = { mode: "create" } | { mode: "edit"; category: Category } | null;

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [nameInput, setNameInput] = useState("");
  const [electionId, setElectionId] = useState<string | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [formState, setFormState] = useState<FormState>(null);

  const name = useDebouncedValue(nameInput, 350);
  const hasActiveFilters = Boolean(name || electionId);

  function resetToFirstPage() {
    setPage(1);
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-categories", { page, limit, name, electionId }],
    queryFn: () => listCategories({ page, limit, name: name || undefined, electionId }),
    placeholderData: keepPreviousData,
  });

  // Populates the election filter. Kept quiet on failure — a nice-to-have,
  // not core to this page.
  const { data: electionsData } = useQuery({
    queryKey: ["admin-elections-lite"],
    queryFn: () => listElections({ limit: 100 }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteCategories(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(ids.length > 1 ? `${ids.length} categories deleted` : "Category deleted");
      setPendingDelete(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete", { description: message });
    },
  });

  const categories = useMemo(() => data?.categories ?? [], [data]);

  function handleResetFilters() {
    setNameInput("");
    setElectionId(undefined);
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
          <h1 className="mt-2 font-display text-display-md text-cream">Categories</h1>
          <p className="mt-2 text-stone">
            Every category across every election. Pick one to manage its nominees.
          </p>
        </div>
        <Button
          disabled={!electionId}
          title={electionId ? undefined : "Filter by an election to create a category in it"}
          onClick={() => setFormState({ mode: "create" })}
        >
          <Plus className="h-4 w-4" />
          New category
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="surface-card mt-8 overflow-hidden"
      >
        <CategoryFilters
          name={nameInput}
          onNameChange={(v) => {
            setNameInput(v);
            resetToFirstPage();
          }}
          electionId={electionId}
          onElectionChange={(v) => {
            setElectionId(v);
            resetToFirstPage();
          }}
          elections={electionsData?.elections ?? []}
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
        />

        {isLoading ? (
          <Table>
            <CategoriesTableHeader showElection />
            <TableSkeletonRows rows={limit > 10 ? 8 : limit} columns={5} />
          </Table>
        ) : isError ? (
          <ErrorState
            description="We couldn't load categories. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={hasActiveFilters ? "No categories match your filters" : "No categories yet"}
            description={
              hasActiveFilters
                ? "Try a different search term or clear your filters."
                : "Open an election to create its first category, or filter by election here."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <CategoriesTable
              categories={categories}
              showElection
              onEdit={(category) => setFormState({ mode: "edit", category })}
              onDelete={(category) => setPendingDelete({ kind: "single", category })}
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
            itemLabel="categories"
          />
        )}
      </motion.div>

      {formState && (
        <CategoryFormDialog
          open
          onOpenChange={(open) => !open && setFormState(null)}
          electionId={
            formState.mode === "edit" ? formState.category.election?.id ?? "" : electionId ?? ""
          }
          category={formState.mode === "edit" ? formState.category : undefined}
        />
      )}

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        isPending={deleteMutation.isPending}
        title={
          pendingDelete === null
            ? ""
            : pendingDelete.kind === "bulk"
              ? `Delete ${pendingDelete.ids.length} categories?`
              : `Delete "${pendingDelete.category.name}"?`
        }
        description="Nominees in this category stay on record but will no longer be publicly reachable."
        onConfirm={() => {
          if (!pendingDelete) return;
          const ids = pendingDelete.kind === "bulk" ? pendingDelete.ids : [pendingDelete.category.id];
          deleteMutation.mutate(ids);
        }}
      />
    </div>
  );
}
