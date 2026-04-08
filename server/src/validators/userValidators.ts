import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional()
});
