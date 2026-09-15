import { z } from "zod";

export const organizerProfileSchema = z.object({
  organizationName: z.string().trim().max(255, "Organization name is too long").optional().or(z.literal("")),
  organizationType: z.enum(["individual", "company", "ngo", "school", "church", "government", "other"]).optional(),
  region: z.string().trim().max(100, "Region is too long").optional().or(z.literal("")),
  city: z.string().trim().max(100, "City is too long").optional().or(z.literal("")),
  organizationPhone: z.string().trim().max(20, "Organization phone is too long").optional().or(z.literal("")),
  website: z.string().trim().url("Enter a valid website URL").max(255, "Website is too long").optional().or(z.literal("")),
  socialMediaUrl: z.string().trim().url("Enter a valid social media URL").max(255, "Social media URL is too long").optional().or(z.literal("")),
  description: z.string().trim().max(5000, "Description is too long").optional().or(z.literal("")),
  ghCardNumber: z.string().trim().max(50, "Ghana Card number is too long").optional().or(z.literal("")),
});

export type OrganizerProfileFormValues = z.infer<typeof organizerProfileSchema>;
