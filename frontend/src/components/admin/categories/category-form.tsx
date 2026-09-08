"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validation/category";

export interface CategoryFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CategoryFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
}

export function CategoryForm({
  mode,
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      displayOrder: "0",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          placeholder="Best Actor"
          disabled={isSubmitting}
          autoComplete="off"
          autoFocus
          {...register("name")}
        />
        <p className="text-xs text-stone">Must be unique within this election.</p>
        {errors.name && <p className="text-xs text-rose">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          rows={3}
          placeholder="What is this category judging?"
          disabled={isSubmitting}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-rose">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-display-order">Display order</Label>
        <Input
          id="category-display-order"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="0"
          className="max-w-[140px]"
          disabled={isSubmitting}
          onKeyDown={(event) => {
            if (!["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) && !/^\d$/.test(event.key)) {
              event.preventDefault();
            }
          }}
          {...register("displayOrder")}
        />
        <p className="text-xs text-stone">Lower numbers show first on the public page.</p>
        {errors.displayOrder && (
          <p className="text-xs text-rose">{errors.displayOrder.message}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : mode === "create" ? (
            "Create category"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
