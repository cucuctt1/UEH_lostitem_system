import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).max(72)
});
