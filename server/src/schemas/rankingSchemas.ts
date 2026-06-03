import { z } from "zod";

import { preferredCategorySchema } from "./userSchemas.js";
import { sanitizeUserString } from "../utils/sanitize.js";

const scoreSchema = z.number().int().min(1).max(5);

const mediaSchema = z
  .object({
    type: z.enum(["image", "video"]),
    emoji: z.string().trim().min(1).max(8).default("📍")
  })
  .strict();

export const createRankingSchema = z
  .object({
    spotName: z
      .string()
      .trim()
      .min(1, "spotName is required.")
      .max(120, "spotName must be at most 120 characters.")
      .transform((value) => sanitizeUserString(value)),
    category: preferredCategorySchema,
    quietness: scoreSchema,
    restroom: scoreSchema,
    wifi: scoreSchema,
    outlets: scoreSchema,
    crowdness: scoreSchema,
    seating: scoreSchema,
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    hours: z
      .string()
      .trim()
      .min(1, "hours is required.")
      .max(80, "hours must be at most 80 characters.")
      .transform((value) => sanitizeUserString(value)),
    notes: z
      .string()
      .trim()
      .max(500, "notes must be at most 500 characters.")
      .transform((value) => sanitizeUserString(value))
      .optional()
      .default(""),
    media: z.array(mediaSchema).max(8, "media can include at most 8 items.").optional().default([])
  })
  .strict();

export const createCommentSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "text is required.")
      .max(500, "text must be at most 500 characters.")
      .transform((value) => sanitizeUserString(value))
  })
  .strict();

export type CreateRankingInput = z.infer<typeof createRankingSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
