"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { TableSkeletonRows } from "@/components/admin/table-skeleton";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { CategoryFormDialog } from "@/components/admin/categories/category-form-dialog";
import {
  CategoriesTable,
  CategoriesTableHeader,
} from "@/components/admin/categories/categories-table";
import { listCategories, deleteCategories, updateCategory } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import type { Category } from "@/lib/api/types";

type PendingDelete = Category | null;
type FormState = { mode: "create" } | { mode: "edit"; category: Category } | null;

export function ElectionCategoriesPanel({ electionId }: { electionId: string }) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FormState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [reorderPendingId, setReorderPendingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-election-categories", electionId],
    queryFn: () => listCategories({ electionId, limit: 100 }),
  });

  // Server doesn't sort by displayOrder for us — keep the panel predictable.
  const categories = [...(data?.categories ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-election-categories", electionId] });
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategories([id]),
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted");
      setPendingDelete(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't delete category", { description: message });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ a, b }: { a: Category; b: Category }) => {
      setReorderPendingId(a.id);
      // Swap displayOrder between the two neighbors.
      await Promise.all([
        updateCategory(a.id, { displayOrder: b.displayOrder }),
        updateCategory(b.id, { displayOrder: a.displayOrder }),
      ]);
    },
    onSuccess: () => invalidate(),
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't reorder categories", { description: message });
    },
    onSettled: () => setReorderPendingId(null),
  });

  function moveUp(category: Category, index: number) {
    const prev = categories[index - 1];
    if (!prev) return;
    reorderMutation.mutate({ a: category, b: prev });
  }

  function moveDown(category: Category, index: number) {
    const next = categories[index + 1];
    if (!next) return;
    reorderMutation.mutate({ a: category, b: next });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base text-cream">Categories</h2>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus className="h-3.5 w-3.5" />
          Add category
        </Button>
      </div>

      <div className="surface-card mt-4 overflow-hidden">
        {isLoading ? (
          <Table>
            <CategoriesTableHeader showElection={false} />
            <TableSkeletonRows rows={3} columns={4} />
          </Table>
        ) : isError ? (
          <ErrorState
            description="We couldn't load categories for this election."
            onRetry={() => refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No categories yet"
            description="Add at least one category with nominees before this election can be activated."
            action={
              <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
                <Plus className="h-3.5 w-3.5" />
                Add category
              </Button>
            }
          />
        ) : (
          <CategoriesTable
            categories={categories}
            showElection={false}
            onEdit={(category) => setFormState({ mode: "edit", category })}
            onDelete={(category) => setPendingDelete(category)}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            reorderPendingId={reorderPendingId}
          />
        )}
      </div>

      {formState && (
        <CategoryFormDialog
          open
          onOpenChange={(open) => !open && setFormState(null)}
          electionId={electionId}
          category={formState.mode === "edit" ? formState.category : undefined}
        />
      )}

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        isPending={deleteMutation.isPending}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        description="Nominees in this category stay on record but will no longer be publicly reachable."
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
      />
    </>
  );
}
