"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import { NomineeFormDialog } from "@/components/admin/nominees/nominee-form-dialog";
import { NomineeDetailDialog } from "@/components/admin/nominees/nominee-detail-dialog";
import { NomineesTable, NomineesTableHeader } from "@/components/admin/nominees/nominees-table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { getCategory, deleteCategories } from "@/lib/api/categories";
import { listNominees, deleteNominees } from "@/lib/api/nominees";
import { ApiError } from "@/lib/api/types";
import type { Nominee } from "@/lib/api/types";

type PendingNomineeDelete =
  | { kind: "single"; nominee: Nominee }
  | { kind: "bulk"; ids: string[] }
  | null;
type NomineeFormState = { mode: "create" } | { mode: "edit"; nominee: Nominee } | null;

const CODE_PATTERN = /^[A-Za-z]{3}\d+$/;

export function CategoryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editingCategory, setEditingCategory] = useState(false);
  const [confirmingCategoryDelete, setConfirmingCategoryDelete] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 350);
  const isCodeSearch = CODE_PATTERN.test(search.trim());

  const [nomineeFormState, setNomineeFormState] = useState<NomineeFormState>(null);
  const [viewingNominee, setViewingNominee] = useState<Nominee | null>(null);
  const [pendingNomineeDelete, setPendingNomineeDelete] = useState<PendingNomineeDelete>(null);

  const {
    data: category,
    isLoading: isLoadingCategory,
    isError: isCategoryError,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ["admin-category", id],
    queryFn: () => getCategory(id),
  });

  const {
    data: nomineesData,
    isLoading: isLoadingNominees,
    isError: isNomineesError,
    refetch: refetchNominees,
    isFetching: isFetchingNominees,
  } = useQuery({
    queryKey: ["admin-category-nominees", id, { page, limit, search }],
    queryFn: () =>
      listNominees({
        categoryId: id,
        page,
        limit,
        name: search && !isCodeSearch ? search : undefined,
        code: search && isCodeSearch ? search : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: () => deleteCategories([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      if (category?.election?.id) {
        queryClient.invalidateQueries({
          queryKey: ["admin-election-categories", category.election.id],
        });
      }
      toast.success("Category deleted");
      if (category?.election?.id) {
        router.push(`/admin/elections/${category.election.id}/edit`);
      } else {
        router.push("/admin/categories");
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete category", { description: message });
      setConfirmingCategoryDelete(false);
    },
  });

  const deleteNomineesMutation = useMutation({
    mutationFn: (ids: string[]) => deleteNominees(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["admin-category-nominees", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-nominees"] });
      toast.success(ids.length > 1 ? `${ids.length} nominees deleted` : "Nominee deleted");
      setPendingNomineeDelete(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete", { description: message });
    },
  });

  const nominees = useMemo(() => nomineesData?.nominees ?? [], [nomineesData]);

  if (isLoadingCategory) {
    return (
      <div className="p-6 md:p-10">
        <Skeleton className="h-4 w-40" />
        <div className="surface-card mt-8 max-w-3xl space-y-4 p-6 md:p-8">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (isCategoryError || !category) {
    return (
      <div className="p-6 md:p-10">
        <div className="surface-card mt-8">
          <ErrorState
            title="Couldn't load this category"
            description="It may have been removed, or there was a connection problem."
            onRetry={() => refetchCategory()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Link
          href={
            category.election ? `/admin/elections/${category.election.id}/edit` : "/admin/categories"
          }
          className="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm text-stone hover:text-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {category.election ? `Back to ${category.election.title}` : "Back to categories"}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-display-md text-cream">{category.name}</h1>
            {category.description && (
              <p className="mt-2 max-w-xl text-stone">{category.description}</p>
            )}
            <p className="mt-2 text-xs text-stone">Display order: {category.displayOrder}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingCategory(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit category
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:border-rose/50 hover:bg-rose/10 hover:text-rose-soft"
              onClick={() => setConfirmingCategoryDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="font-display text-base text-cream">Nominees</h2>
          <p className="mt-1 text-sm text-stone">Everyone competing in this category.</p>
        </div>
        <Button size="sm" onClick={() => setNomineeFormState({ mode: "create" })}>
          <Plus className="h-3.5 w-3.5" />
          Add nominee
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        className="surface-card mt-4 overflow-hidden"
      >
        <div className="border-b border-border/50 p-4">
          <div className="relative max-w-xs">
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or code…"
              aria-label="Search nominees in this category"
              className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </div>

        {isLoadingNominees ? (
          <Table>
            <NomineesTableHeader showCategory={false} />
            <TableSkeletonRows rows={limit > 10 ? 8 : limit} columns={4} />
          </Table>
        ) : isNomineesError ? (
          <ErrorState
            description="We couldn't load nominees. Check your connection and try again."
            onRetry={() => refetchNominees()}
          />
        ) : nominees.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={search ? "No nominees match your search" : "No nominees yet"}
            description={
              search
                ? "Try a different search term."
                : "Add nominees so voters can start casting votes in this category."
            }
            action={
              search ? undefined : (
                <Button size="sm" onClick={() => setNomineeFormState({ mode: "create" })}>
                  <Plus className="h-3.5 w-3.5" />
                  Add nominee
                </Button>
              )
            }
          />
        ) : (
          <div className={isFetchingNominees ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <NomineesTable
              nominees={nominees}
              showCategory={false}
              onEdit={(nominee) => setNomineeFormState({ mode: "edit", nominee })}
              onDelete={(nominee) => setPendingNomineeDelete({ kind: "single", nominee })}
              onView={setViewingNominee}
            />
          </div>
        )}

        {nomineesData && nomineesData.pagination.total > 0 && (
          <PaginationControls
            pagination={nomineesData.pagination}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            itemLabel="nominees"
          />
        )}
      </motion.div>

      {editingCategory && (
        <CategoryFormDialog
          open
          onOpenChange={setEditingCategory}
          electionId={category.election?.id ?? ""}
          category={category}
        />
      )}

      {nomineeFormState && (
        <NomineeFormDialog
          open
          onOpenChange={(open) => !open && setNomineeFormState(null)}
          context={{ kind: "category", categoryId: category.id, categoryName: category.name }}
          nominee={nomineeFormState.mode === "edit" ? nomineeFormState.nominee : undefined}
        />
      )}

      <NomineeDetailDialog
        nominee={viewingNominee}
        open={viewingNominee !== null}
        onOpenChange={(open) => !open && setViewingNominee(null)}
      />

      <DeleteConfirmDialog
        open={confirmingCategoryDelete}
        onOpenChange={setConfirmingCategoryDelete}
        isPending={deleteCategoryMutation.isPending}
        title={`Delete "${category.name}"?`}
        description="Nominees in this category stay on record but will no longer be publicly reachable."
        onConfirm={() => deleteCategoryMutation.mutate()}
      />

      <DeleteConfirmDialog
        open={pendingNomineeDelete !== null}
        onOpenChange={(open) => !open && setPendingNomineeDelete(null)}
        isPending={deleteNomineesMutation.isPending}
        title={
          pendingNomineeDelete === null
            ? ""
            : pendingNomineeDelete.kind === "bulk"
              ? `Delete ${pendingNomineeDelete.ids.length} nominees?`
              : `Delete "${pendingNomineeDelete.nominee.name}"?`
        }
        description="This removes the nominee from the public site. Vote history stays on record."
        onConfirm={() => {
          if (!pendingNomineeDelete) return;
          const ids =
            pendingNomineeDelete.kind === "bulk"
              ? pendingNomineeDelete.ids
              : [pendingNomineeDelete.nominee.id];
          deleteNomineesMutation.mutate(ids);
        }}
      />
    </div>
  );
}
