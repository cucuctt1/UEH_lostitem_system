import { z } from "zod";
import { normalizeTagFilter, parseTagsInput } from "../utils/tags";

const tagsSchema = z.preprocess(
  (value) => parseTagsInput(value),
  z.array(z.string().min(1).max(40)).max(10)
);

export const createPostSchema = z.object({
  type: z.enum(["lost", "found"]),
  title: z.string().min(5).max(150),
  description: z.string().min(10).max(5000),
  categoryId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive(),
  eventTime: z.string().datetime(),
  tags: tagsSchema.default([]),
  contactNote: z.string().max(300).optional(),
  status: z.enum(["searching", "found", "returned"]).optional()
});

export const updatePostSchema = createPostSchema.partial();

export const postSearchSchema = z.object({
  keyword: z.string().optional(),
  tag: z.string().optional().transform((value) => normalizeTagFilter(value)),
  locationId: z.coerce.number().int().positive().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.enum(["newest", "relevance"]).optional(),
  type: z.enum(["lost", "found"]).optional()
});

export const createPostCommentSchema = z.object({
  content: z.string().min(1).max(1000)
});
