import { z } from "zod";

export const verifyMatchSchema = z.object({
  status: z.enum(["accepted", "rejected"])
});