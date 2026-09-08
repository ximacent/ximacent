import { z } from "zod";

/** categoryId is validated separately (it's a Select, not free text) but still
 * needs to be present — required() gives a clear message if somehow submitted empty. */
export const nomineeFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name is too long"),
  bio: z.string().max(2000, "Bio is too long").optional(),
  categoryId: z.string().min(1, "Choose a category"),
});

export type NomineeFormValues = z.infer<typeof nomineeFormSchema>;

export const MAX_NOMINEE_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateNomineeImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "That's not an image file";
  if (file.size > MAX_NOMINEE_IMAGE_BYTES) return "Keep nominee photos under 5MB";
  return null;
}
