import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().max(320),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128),
  displayName: z.string().trim().min(2).max(120),
  intent: z.enum(["customer", "seller"]),
});

export const loginSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
