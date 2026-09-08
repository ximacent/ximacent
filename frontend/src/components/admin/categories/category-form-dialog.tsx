"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { createCategory, updateCategory } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import type { Category } from "@/lib/api/types";
import type { CategoryFormValues } from "@/lib/validation/category";

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required for create; ignored for edit (electionId can't be changed via PATCH). */
  electionId: string;
  /** Present in edit mode. */
  category?: Category;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  electionId,
  category,
}: CategoryFormDialogProps) {
  const queryClient = useQueryClient();
  const mode = category ? "edit" : "create";

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-election-categories", electionId] });
    if (category) {
      queryClient.invalidateQueries({ queryKey: ["admin-category", category.id] });
    }
  }

  const createMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      createCategory({
        name: values.name,
        description: values.description?.trim() || undefined,
        displayOrder: values.displayOrder ? Number(values.displayOrder) : undefined,
        electionId,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Category created");
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't create category", { description: message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      if (!category) throw new Error("Missing category for edit");
      return updateCategory(category.id, {
        name: values.name,
        description: values.description?.trim() || undefined,
        displayOrder: values.displayOrder ? Number(values.displayOrder) : undefined,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Category updated");
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't save changes", { description: message });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New category" : "Edit category"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Categories group nominees together, e.g. \u201cBest Actor\u201d or \u201cPeople's Choice\u201d."
              : "Update the name, description, or display order."}
          </DialogDescription>
        </DialogHeader>

        <CategoryForm
          mode={mode}
          isSubmitting={isPending}
          defaultValues={
            category
              ? {
                  name: category.name,
                  description: category.description ?? "",
                  displayOrder: String(category.displayOrder ?? 0),
                }
              : undefined
          }
          onSubmit={(values) =>
            mode === "create" ? createMutation.mutate(values) : updateMutation.mutate(values)
          }
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
