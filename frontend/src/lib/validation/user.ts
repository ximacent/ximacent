import { z } from "zod";

export interface PasswordRequirement {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

/** Single source of truth for password strength — both the zod schema
 * below and the visual strength meter derive from this list, so the rules
 * shown to the user and the rules actually enforced can never drift apart. */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "number", label: "At least one number", test: (v) => /\d/.test(v) },
  {
    id: "special",
    label: "At least one special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .superRefine((value, ctx) => {
    for (const requirement of PASSWORD_REQUIREMENTS) {
      if (!requirement.test(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: requirement.label });
      }
    }
  });

export const createUserFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  phone: z.string().min(1, "Phone number is required").max(30, "Phone number is too long"),
  password: passwordSchema,
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
