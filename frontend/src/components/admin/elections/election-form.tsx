"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildElectionSchema, type ElectionFormValues } from "@/lib/validation/election";
import type { ElectionStatus } from "@/lib/api/types";

export interface ElectionFormProps {
  mode: "create" | "edit";
  /** Current status — only meaningful in edit mode; drives the pricePerVote lock. */
  status?: ElectionStatus;
  defaultValues?: Partial<ElectionFormValues>;
  isSubmitting: boolean;
  onSubmit: (values: ElectionFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ElectionForm({
  mode,
  status,
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel,
}: ElectionFormProps) {
  const priceLocked = mode === "edit" && status !== undefined && status !== "draft";
  // The backend only enforces "startDate can't be in the past" while the
  // election is still a draft — so skip that guard for an already
  // active/closed election being edited.
  const enforceFutureStart = mode === "create" || status === "draft";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ElectionFormValues>({
    resolver: zodResolver(buildElectionSchema({ enforceFutureStart })),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      pricePerVote: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Miss Universe Ghana 2026"
          disabled={isSubmitting}
          autoComplete="off"
          {...register("title")}
        />
        <p className="text-xs text-stone">Saved in uppercase and used to generate the public slug.</p>
        {errors.title && <p className="text-xs text-rose">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="What is this election for?"
          disabled={isSubmitting}
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-rose">{errors.description.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="datetime-local"
            disabled={isSubmitting}
            {...register("startDate")}
          />
          {errors.startDate && <p className="text-xs text-rose">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            type="datetime-local"
            disabled={isSubmitting}
            {...register("endDate")}
          />
          {errors.endDate && <p className="text-xs text-rose">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricePerVote" className="flex items-center gap-1.5">
          Price per vote (GHS)
          {priceLocked && <Lock className="h-3 w-3 text-stone" />}
        </Label>
        <Input
          id="pricePerVote"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0.50"
          disabled={isSubmitting || priceLocked}
          onKeyDown={(event) => {
            if (["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
          }}
          {...register("pricePerVote")}
        />
        {priceLocked ? (
          <p className="text-xs text-stone">
            Locked once an election leaves draft — this keeps every vote already cast at a
            consistent price.
          </p>
        ) : (
          errors.pricePerVote && <p className="text-xs text-rose">{errors.pricePerVote.message}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : (
            submitLabel ?? (mode === "create" ? "Create election" : "Save changes")
          )}
        </Button>
      </div>
    </form>
  );
}
