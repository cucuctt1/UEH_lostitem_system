import { z } from "zod";

export const createReportSchema = z.object({
  targetPostId: z.number().int().positive().optional(),
  targetUserId: z.number().int().positive().optional(),
  reason: z.enum(["spam", "fraud", "abuse", "unsafe", "other"]),
  details: z.string().min(5).max(1000)
}).refine((value) => Boolean(value.targetPostId || value.targetUserId), {
  message: "Provide targetPostId or targetUserId"
});
