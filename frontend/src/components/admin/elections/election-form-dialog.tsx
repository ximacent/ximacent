"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createElection, updateElection } from "@/lib/api/elections";
import { ApiError } from "@/lib/api/types";
import type { Election } from "@/lib/api/types";

// Mirrors backend validation exactly (election.validator.ts):
// - endDate must be after startDate
// - startDate cannot be in the past (only enforced for DRAFT elections,
//   which is the only state this form ever creates/edits dates for —
//   pricePerVote/dates become read-only server-side once non-draft anyway)
// - pricePerVote must be a positive number
const electionSchema = z
  .object({
    title: z.string().min(1, "Title is required").trim(),
    description: z.string().trim().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    pricePerVote: z
      .string()
      .min(1, "Price per vote is required")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
        message: "Must be a positive number",
      }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type ElectionFormValues = z.infer<typeof electionSchema>;

/** Converts an ISO datetime to the value <input type="datetime-local"> expects. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function ElectionFormDialog({
  open,
  onOpenChange,
  election,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. Absent = create mode. */
  election?: Election;
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(election);
  // Price/dates are locked server-side once an election leaves draft —
  // reflect that in the form so admins aren't confused by a rejected save.
  const isLocked = isEditing && election!.status !== "draft";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ElectionFormValues>({
    resolver: zodResolver(electionSchema),
  });

  useEffect(() => {
    if (open) {
      reset(
        election
          ? {
              title: election.title,
              description: election.description ?? "",
              startDate: toDatetimeLocal(election.startDate),
              endDate: toDatetimeLocal(election.endDate),
              pricePerVote: election.pricePerVote,
            }
          : { title: "", description: "", startDate: "", endDate: "", pricePerVote: "" }
      );
    }
  }, [open, election, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ElectionFormValues) => {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        pricePerVote: values.pricePerVote,
      };

      return isEditing
        ? updateElection(election!.id, payload)
        : createElection({ ...payload, status: "draft" });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Election updated" : "Election created");
      queryClient.invalidateQueries({ queryKey: ["admin-elections"] });
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      toast.error(isEditing ? "Couldn't update election" : "Couldn't create election", {
        description: message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit election" : "Create election"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this election."
              : "New elections start in draft — activate them once ready."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Miss Universe Ghana 2026" {...register("title")} />
            {errors.title && <p className="text-xs text-rose">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Annual national pageant"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="datetime-local" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-xs text-rose">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="datetime-local" {...register("endDate")} />
              {errors.endDate && <p className="text-xs text-rose">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerVote">
              Price per vote (GHS)
              {isLocked && (
                <span className="ml-2 text-xs font-normal text-stone">
                  — locked once launched
                </span>
              )}
            </Label>
            <Input
              id="pricePerVote"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.50"
              readOnly={isLocked}
              aria-readonly={isLocked}
              className={isLocked ? "cursor-not-allowed opacity-60" : undefined}
              {...register("pricePerVote")}
            />
            {errors.pricePerVote && (
              <p className="text-xs text-rose">{errors.pricePerVote.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Save changes" : "Create election"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
