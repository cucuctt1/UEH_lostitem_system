import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.coerce.number().int().positive().optional(),
  postId: z.coerce.number().int().positive().optional(),
  receiverId: z.coerce.number().int().positive().optional(),
  text: z.string().max(4000).optional(),
  imageUrl: z.string().url().optional()
});

export const confirmReturnSchema = z.object({
  matchId: z.coerce.number().int().positive()
});
