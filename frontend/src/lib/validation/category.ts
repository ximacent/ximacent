import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  displayOrder: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "" || /^\d+$/.test(v), {
      message: "Display order must be a whole number",
    }),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
