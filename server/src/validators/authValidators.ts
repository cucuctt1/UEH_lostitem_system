import { z } from "zod";

const studentEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .refine((value) => value.endsWith("@st.ueh.edu.vn"), {
    message: "Email must end with @st.ueh.edu.vn"
  });

export const loginSchema = z.object({
  email: studentEmailSchema,
  password: z.string().min(6)
});
