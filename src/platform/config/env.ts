import { z } from "zod";

const publicConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type LogLevel = PublicConfig["LOG_LEVEL"];

export type PublicEnv = {
  NODE_ENV?: string | undefined;
  LOG_LEVEL?: string | undefined;
};

export function readPublicConfig(env: PublicEnv = process.env): PublicConfig {
  const parsed = publicConfigSchema.safeParse({
    NODE_ENV: env.NODE_ENV,
    LOG_LEVEL: env.LOG_LEVEL,
  });
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter((field) => field.length > 0);
    const names = fields.length > 0 ? fields.join(", ") : "NODE_ENV, LOG_LEVEL";
    throw new Error(`Invalid application configuration: ${names}`);
  }
  return parsed.data;
}
