"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { NomineeImageField } from "./nominee-image-field";
import { nomineeFormSchema, type NomineeFormValues } from "@/lib/validation/nominee";

export interface NomineeCategoryOption {
  id: string;
  name: string;
}

export interface NomineeFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<NomineeFormValues>;
  /** Read-only auto-generated code, shown only in edit mode. */
  code?: string;
  /** Selectable categories to (re)assign this nominee to — restricted to the
   * nominee's own election when editing, since cross-election moves are
   * rejected by the backend. */
  categoryOptions: NomineeCategoryOption[];
  categoryOptionsLoading?: boolean;
  /** When set, the category is fixed to this context (e.g. creating from
   * within a category's own page) and rendered as read-only text instead of
   * a select. */
  fixedCategoryLabel?: string;
  existingImageUrl?: string | null;
  onImageChange: (file: File | null) => void;
  isSubmitting: boolean;
  onSubmit: (values: NomineeFormValues) => void;
  onCancel: () => void;
}

export function NomineeForm({
  mode,
  defaultValues,
  code,
  categoryOptions,
  categoryOptionsLoading,
  fixedCategoryLabel,
  existingImageUrl,
  onImageChange,
  isSubmitting,
  onSubmit,
  onCancel,
}: NomineeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NomineeFormValues>({
    resolver: zodResolver(nomineeFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      categoryId: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nominee-name">Name</Label>
        <Input
          id="nominee-name"
          placeholder="Jane Doe"
          disabled={isSubmitting}
          autoComplete="off"
          autoFocus
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-rose">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nominee-bio">Bio</Label>
        <Textarea
          id="nominee-bio"
          rows={3}
          placeholder="A short introduction for this nominee (optional)"
          disabled={isSubmitting}
          {...register("bio")}
        />
        {errors.bio && <p className="text-xs text-rose">{errors.bio.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nominee-category">Category</Label>
        {fixedCategoryLabel ? (
          <>
            <input type="hidden" {...register("categoryId")} />
            <p className="rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm text-stone">
              {fixedCategoryLabel}
            </p>
          </>
        ) : (
          <>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                  options={categoryOptions.map((option) => ({ value: option.id, label: option.name }))}
                  placeholder={categoryOptionsLoading ? "Loading categories..." : "Choose a category"}
                  searchPlaceholder="Search categories..."
                  disabled={isSubmitting || categoryOptionsLoading || categoryOptions.length === 0}
                  aria-label="Nominee category"
                />
              )}
            />
            {mode === "edit" && (
              <p className="text-xs text-stone">
                Only categories within the same election are shown — moving a nominee across
                elections isn&apos;t supported.
              </p>
            )}
            {errors.categoryId && (
              <p className="text-xs text-rose">{errors.categoryId.message}</p>
            )}
          </>
        )}
      </div>

      <NomineeImageField
        existingImageUrl={existingImageUrl}
        disabled={isSubmitting}
        onChange={onImageChange}
      />

      {code && (
        <p className="text-xs text-stone">
          Code <span className="font-medium text-cream-muted">{code}</span> is generated
          automatically and can&apos;t be changed.
        </p>
      )}

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
            "Add nominee"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
