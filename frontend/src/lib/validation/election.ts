import { z } from "zod";

/** Matches the "0.50"-style decimal string the API expects for pricePerVote. */
const priceString = z
  .string()
  .min(1, "Price per vote is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 0.50")
  .refine((v) => Number(v) > 0, "Price per vote must be greater than 0");

/**
 * `enforceFutureStart` mirrors the backend rule that startDate can't be in
 * the past — but the API only enforces that while the election is still a
 * draft, so the edit form for an already-active/closed election skips it.
 */
export function buildElectionSchema({ enforceFutureStart }: { enforceFutureStart: boolean }) {
  return z
    .object({
      title: z
        .string()
        .min(1, "Title is required")
        .max(200, "Title is too long"),
      description: z.string().max(2000, "Description is too long").optional(),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      pricePerVote: priceString,
    })
    .superRefine((values, ctx) => {
      const start = new Date(values.startDate);
      const end = new Date(values.endDate);

      if (Number.isNaN(start.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid start date", path: ["startDate"] });
      }
      if (Number.isNaN(end.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid end date", path: ["endDate"] });
      }
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after the start date",
          path: ["endDate"],
        });
      }
      if (enforceFutureStart && !Number.isNaN(start.getTime()) && start.getTime() < Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date can't be in the past",
          path: ["startDate"],
        });
      }
    });
}

export type ElectionFormValues = {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  pricePerVote: string;
};
