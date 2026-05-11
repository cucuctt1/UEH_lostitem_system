import { z } from "zod";

const studentEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .refine((value) => value.endsWith("@st.ueh.edu.vn"), {
    message: "Email must end with @st.ueh.edu.vn"
  });

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

export const createUserByAdminSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: studentEmailSchema,
  temporaryPassword: z.string().min(8).max(72)
});

export const createTagByAdminSchema = z.object({
  name: z.string().min(1).max(41),
  isPrebuilt: z.boolean().optional()
});

export const updateTagByAdminSchema = z.object({
  name: z.string().min(1).max(41),
  isPrebuilt: z.boolean().optional()
});
