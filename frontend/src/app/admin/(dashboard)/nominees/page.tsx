"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { NomineeFilters } from "@/components/admin/nominees/nominee-filters";
import { NomineeFormDialog } from "@/components/admin/nominees/nominee-form-dialog";
import { NomineeDetailDialog } from "@/components/admin/nominees/nominee-detail-dialog";
import { NomineesTable, NomineesTableHeader } from "@/components/admin/nominees/nominees-table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { listNominees, deleteNominees } from "@/lib/api/nominees";
import { listCategories } from "@/lib/api/categories";
import { listElections } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import type { Nominee } from "@/lib/api/types";

type PendingDelete = { kind: "single"; nominee: Nominee } | { kind: "bulk"; ids: string[] } | null;
type FormState = { mode: "create" } | { mode: "edit"; nominee: Nominee } | null;

/** Nominee codes are a 3-letter prefix + digits (e.g. "MIS0001") — route a
 * search that matches that shape to the `code` param instead of `name`,
 * since the API filters on them independently rather than as one free-text field. */
const CODE_PATTERN = /^[A-Za-z]{3}\d+$/;

export default function AdminNomineesPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [electionId, setElectionId] = useState<string | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [formState, setFormState] = useState<FormState>(null);
  const [viewingNominee, setViewingNominee] = useState<Nominee | null>(null);

  const search = useDebouncedValue(searchInput, 350);
  const hasActiveFilters = Boolean(search || electionId || categoryId);
  const isCodeSearch = CODE_PATTERN.test(search.trim());

  function resetToFirstPage() {
    setPage(1);
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-nominees", { page, limit, search, electionId, categoryId }],
    queryFn: () =>
      listNominees({
        page,
        limit,
        categoryId,
        name: search && !isCodeSearch ? search : undefined,
        code: search && isCodeSearch ? search : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Populates the category filter/select. Kept quiet on failure.
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: () => listCategories({ limit: 200 }),
    staleTime: 60_000,
    retry: false,
  });

  const { data: electionsData } = useQuery({
    queryKey: ["admin-elections-lite"],
    queryFn: () => listElections({ limit: 100 }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const filteredCategories = (categoriesData?.categories ?? []).filter(
    (category) => !electionId || category.election?.id === electionId
  );

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteNominees(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-nominees"] });
      toast.success(ids.length > 1 ? `${ids.length} nominees deleted` : "Nominee deleted");
      setPendingDelete(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete", { description: message });
    },
  });

  const nominees = useMemo(() => data?.nominees ?? [], [data]);

  function handleResetFilters() {
    setSearchInput("");
    setCategoryId(undefined);
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
          <h1 className="mt-2 font-display text-display-md text-cream">Nominees</h1>
          <p className="mt-2 text-stone">Every nominee across every category.</p>
        </div>
        <Button
          disabled={!electionId || !categoryId}
          title={
            electionId && categoryId
              ? undefined
              : "Filter by an election and category to create a nominee"
          }
          onClick={() => setFormState({ mode: "create" })}
        >
          <Plus className="h-4 w-4" />
          New nominee
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="surface-card mt-8 overflow-hidden"
      >
        <NomineeFilters
          name={searchInput}
          onNameChange={(v) => {
            setSearchInput(v);
            resetToFirstPage();
          }}
          categoryId={categoryId}
          onCategoryChange={(v) => {
            setCategoryId(v);
            resetToFirstPage();
          }}
          electionId={electionId}
          onElectionChange={(v) => {
            setElectionId(v);
            setCategoryId(undefined);
            resetToFirstPage();
          }}
          elections={electionsData?.elections ?? []}
          categories={filteredCategories}
          hasActiveFilters={hasActiveFilters}
          onReset={handleResetFilters}
        />

        {isLoading ? (
          <Table>
            <NomineesTableHeader showCategory />
            <TableSkeletonRows rows={limit > 10 ? 8 : limit} columns={5} />
          </Table>
        ) : isError ? (
          <ErrorState
            description="We couldn't load nominees. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : nominees.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={hasActiveFilters ? "No nominees match your filters" : "No nominees yet"}
            description={
              hasActiveFilters
                ? "Try a different search term or clear your filters."
                : "Add nominees within a category so voters have someone to vote for."
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
            <NomineesTable
              nominees={nominees}
              showCategory
              onEdit={(nominee) => setFormState({ mode: "edit", nominee })}
              onDelete={(nominee) => setPendingDelete({ kind: "single", nominee })}
              onView={setViewingNominee}
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
            itemLabel="nominees"
          />
        )}
      </motion.div>

      {formState && (
        <NomineeFormDialog
          open
          onOpenChange={(open) => !open && setFormState(null)}
          context={{ kind: "category", categoryId: categoryId as string, categoryName: filteredCategories.find((category) => category.id === categoryId)?.name ?? "" }}
          nominee={formState.mode === "edit" ? formState.nominee : undefined}
        />
      )}

      <NomineeDetailDialog
        nominee={viewingNominee}
        open={viewingNominee !== null}
        onOpenChange={(open) => !open && setViewingNominee(null)}
      />

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        isPending={deleteMutation.isPending}
        title={
          pendingDelete === null
            ? ""
            : pendingDelete.kind === "bulk"
              ? `Delete ${pendingDelete.ids.length} nominees?`
              : `Delete "${pendingDelete.nominee.name}"?`
        }
        description="This removes the nominee from the public site. Vote history stays on record."
        onConfirm={() => {
          if (!pendingDelete) return;
          const ids = pendingDelete.kind === "bulk" ? pendingDelete.ids : [pendingDelete.nominee.id];
          deleteMutation.mutate(ids);
        }}
      />
    </div>
  );
}
