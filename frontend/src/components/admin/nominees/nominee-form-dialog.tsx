"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NomineeForm } from "./nominee-form";
import { createNominee, updateNominee } from "@/lib/api/nominees";
import { listCategories, getCategory } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/types";
import type { Nominee } from "@/lib/api/types";
import type { NomineeFormValues } from "@/lib/validation/nominee";

export type NomineeFormContext =
  | { kind: "category"; categoryId: string; categoryName: string }
  | { kind: "global" };

export interface NomineeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: NomineeFormContext;
  /** Present in edit mode. */
  nominee?: Nominee;
}

export function NomineeFormDialog({
  open,
  onOpenChange,
  context,
  nominee,
}: NomineeFormDialogProps) {
  const queryClient = useQueryClient();
  const mode = nominee ? "edit" : "create";
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Edit mode always needs to know the nominee's *election* (not just its
  // current category) so the reassignment select only ever offers sibling
  // categories — the backend rejects moving a nominee across elections.
  const currentCategoryId = nominee?.category?.id;
  const { data: currentCategory, isLoading: isLoadingCurrentCategory } = useQuery({
    queryKey: ["admin-category", currentCategoryId],
    queryFn: () => getCategory(currentCategoryId as string),
    enabled: mode === "edit" && Boolean(currentCategoryId),
  });

  const electionIdForOptions = mode === "edit" ? currentCategory?.election?.id : undefined;

  const { data: siblingCategoriesData, isLoading: isLoadingSiblingCategories } = useQuery({
    queryKey: ["admin-categories-by-election", electionIdForOptions],
    queryFn: () => listCategories({ electionId: electionIdForOptions, limit: 100 }),
    enabled: mode === "edit" && Boolean(electionIdForOptions),
  });

  const { data: globalCategoriesData, isLoading: isLoadingGlobalCategories } = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: () => listCategories({ limit: 200 }),
    enabled: mode === "create" && context.kind === "global",
    staleTime: 60_000,
  });

  const categoryOptions =
    mode === "edit"
      ? (siblingCategoriesData?.categories ?? []).map((c) => ({ id: c.id, name: c.name }))
      : context.kind === "global"
        ? (globalCategoriesData?.categories ?? []).map((c) => ({
            id: c.id,
            name: c.election ? `${c.name} — ${c.election.title}` : c.name,
          }))
        : [];

  const categoryOptionsLoading =
    mode === "edit"
      ? isLoadingCurrentCategory || isLoadingSiblingCategories
      : context.kind === "global"
        ? isLoadingGlobalCategories
        : false;

  function invalidate(categoryId: string) {
    queryClient.invalidateQueries({ queryKey: ["admin-nominees"] });
    queryClient.invalidateQueries({ queryKey: ["admin-category-nominees", categoryId] });
    if (nominee?.category?.id && nominee.category.id !== categoryId) {
      queryClient.invalidateQueries({
        queryKey: ["admin-category-nominees", nominee.category.id],
      });
    }
  }

  function resetLocalState() {
    setImageFile(null);
  }

  const fallbackCategoryId = context.kind === "category" ? context.categoryId : "";

  const createMutation = useMutation({
    mutationFn: (values: NomineeFormValues) =>
      createNominee({
        name: values.name,
        bio: values.bio?.trim() || undefined,
        categoryId: values.categoryId,
        image: imageFile ?? undefined,
      }),
    onSuccess: (created) => {
      invalidate(created.category?.id ?? fallbackCategoryId);
      toast.success("Nominee added");
      resetLocalState();
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error("Couldn't add nominee", { description: message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: NomineeFormValues) => {
      if (!nominee) throw new Error("Missing nominee for edit");
      return updateNominee(nominee.id, {
        name: values.name,
        bio: values.bio?.trim() || undefined,
        categoryId: values.categoryId,
        image: imageFile ?? undefined,
      });
    },
    onSuccess: (updated) => {
      invalidate(updated.category?.id ?? currentCategoryId ?? "");
      toast.success("Nominee updated");
      resetLocalState();
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        if (!next) resetLocalState();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New nominee" : "Edit nominee"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a nominee with an optional photo. A voting code is generated automatically."
              : "Update this nominee's details, category, or photo."}
          </DialogDescription>
        </DialogHeader>

        <NomineeForm
          mode={mode}
          code={nominee?.code}
          existingImageUrl={nominee?.imageUrl}
          onImageChange={setImageFile}
          categoryOptions={categoryOptions}
          categoryOptionsLoading={categoryOptionsLoading}
          fixedCategoryLabel={
            mode === "create" && context.kind === "category" ? context.categoryName : undefined
          }
          defaultValues={{
            name: nominee?.name ?? "",
            bio: nominee?.bio ?? "",
            categoryId:
              mode === "create" && context.kind === "category"
                ? context.categoryId
                : nominee?.category?.id ?? "",
          }}
          isSubmitting={isPending}
          onSubmit={(values) =>
            mode === "create" ? createMutation.mutate(values) : updateMutation.mutate(values)
          }
          onCancel={() => {
            resetLocalState();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
