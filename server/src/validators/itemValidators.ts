import { z } from "zod";

export const createStoredItemSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1500).optional(),
  senderName: z.string().max(120).optional(),
  senderStudentId: z.string().max(30).optional(),
  categoryId: z.number().int().positive(),
  locationId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  status: z.enum(["stored", "claimed", "disposed"]),
  postId: z.number().int().positive().optional()
});

export const updateStoredItemStatusSchema = z.object({
  status: z.enum(["stored", "claimed", "disposed"])
});

export const updateStoredItemSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1500).optional(),
  senderName: z.string().max(120).optional(),
  senderStudentId: z.string().max(30).optional(),
  categoryId: z.number().int().positive(),
  locationId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  status: z.enum(["stored", "claimed", "disposed"])
});
