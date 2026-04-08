import { z } from "zod";

export const createStoredItemSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().min(5).max(1500),
  categoryId: z.number().int().positive(),
  locationId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  status: z.enum(["stored", "claimed", "disposed"]),
  postId: z.number().int().positive().optional()
});

export const updateStoredItemStatusSchema = z.object({
  status: z.enum(["stored", "claimed", "disposed"])
});
