import { z } from "zod";

import { sanitizeUserString } from "../utils/sanitize.js";

export const preferredCategorySchema = z.enum(["Libraries", "Cafes", "Outdoors", "Other"]);

export type PreferredCategory = z.infer<typeof preferredCategorySchema>;

export const updateUserProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "displayName must be at least 1 character.")
      .max(80, "displayName must be at most 80 characters.")
      .transform((value) => sanitizeUserString(value)),
    bio: z
      .string()
      .trim()
      .max(300, "bio must be at most 300 characters.")
      .transform((value) => sanitizeUserString(value)),
    preferredCategories: z
      .array(preferredCategorySchema)
      .max(4, "preferredCategories can include at most 4 categories.")
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable profile field is required."
  });

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
