import { z } from "zod";

export const approvePostSchema = z.object({
  postId: z.number().int().positive(),
  approved: z.boolean(),
  note: z.string().max(300).optional()
});

export const lockUserSchema = z.object({
  userId: z.number().int().positive(),
  locked: z.boolean(),
  reason: z.string().max(300).optional()
});
