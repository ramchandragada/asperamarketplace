import { z } from "zod";

/** Same shape as Prisma `@db.Uuid` / `assertUuid` — not strict RFC 4122 version/variant. */
export const DB_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dbUuid = z
  .string()
  .regex(DB_UUID_RE, "Must be a valid UUID");

export function isDbUuid(value: string): boolean {
  return DB_UUID_RE.test(value);
}
